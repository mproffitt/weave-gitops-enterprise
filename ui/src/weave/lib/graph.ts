// A collection of helper functions to render a graph of kubernetes objects
// with in the context of their parent-child relationships.
import _ from "lodash";
import { convertResponse } from "../hooks/objects";
import { Core } from "./api/core/core.pb";
import { GroupVersionKind, Kind } from "./api/core/types.pb";
import { FluxObject } from "./objects";

// Kubernetes does not allow us to query children by parents.
// We keep a list of common parent-child relationships
// to look up children recursively.
export const PARENT_CHILD_LOOKUP = {
  Deployment: {
    group: "apps",
    version: "v1",
    kind: "Deployment",
    children: [
      {
        group: "apps",
        version: "v1",
        kind: "ReplicaSet",
        children: [{ version: "v1", kind: "Pod" }],
      },
    ],
  },
  StatefulSet: {
    group: "apps",
    version: "v1",
    kind: "StatefulSet",
    children: [{ version: "v1", kind: "Pod" }],
  },
};

const objID = (obj: FluxObject) =>
  `${obj.clusterName}/${obj.namespace}/${obj.type}/${obj.name}`;

const sortFn = (a: FluxObject, b: FluxObject) => {
  return objID(a).localeCompare(objID(b));
};

export const getChildrenRecursive = async (
  client: typeof Core,
  namespace: string,

  object: FluxObject,
  clusterName: string,
  lookup: any
) => {
  const children: FluxObject[] = [];

  const k = lookup[object.type as string];

  if (k && k.children) {
    for (let i = 0; i < k.children.length; i++) {
      const child: GroupVersionKind = k.children[i];

      const res = await client.GetChildObjects({
        parentUid: object.uid,
        namespace,
        groupVersionKind: child,
        clusterName: clusterName,
      });

      if (res.objects) {
        for (let q = 0; q < res.objects.length; q++) {
          const c = convertResponse("", res.objects[q]);
          const childKind = child.kind as string;
          await getChildrenRecursive(client, namespace, c, clusterName, {
            [childKind]: child,
          });
          children.push(c);
        }
      }
    }
  }
  // Mutates
  children.sort(sortFn);
  object.children = children;
};

// Gets the "child" objects that result from an Application
export const getChildren = async (
  client: typeof Core,
  automationName: string,
  namespace: string,
  automationKind: Kind,
  kinds: GroupVersionKind[],
  clusterName: string
): Promise<FluxObject[]> => {
  const { objects } = await client.GetReconciledObjects({
    automationName,
    namespace,
    automationKind,
    kinds,
    clusterName,
  });

  const fluxObjs = _.map(objects, (o) => convertResponse("", o));
  fluxObjs.sort(sortFn);

  const result: FluxObject[] = [];
  for (let o = 0; o < fluxObjs.length; o++) {
    const obj = fluxObjs[o];
    await getChildrenRecursive(
      client,
      namespace,
      obj,
      clusterName,
      PARENT_CHILD_LOOKUP
    );
    result.push(obj);
  }
  const flat = _.flatten(result);

  return flat;
};
