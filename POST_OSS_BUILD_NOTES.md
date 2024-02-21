# Notes from building Weaveworks GitOps Enterprise

> **Note** This will probably not be structured, it's just what it took to get
> this to build

Since it being opensourced, building this repo has taken some effort as a result
of required hosted components not being made public.

I think given everything that Weaveworks has dumped, not having hosted components
and having to "self-host" them is not too big a deal.

> Before I continue I wish to make this clear. I am not, and have never been
> affiliated with the former `Weaveworks` in any way, shape or form but I have
> every respect for the company and its former employees.
>
> These are my personal notes from building the Enterprise UI the day I
> discovered it had been released to the world (Monday 19th Feb 2024)
>
> If you have an issue with anything discussed in this document, please reach
> out to me directly using `gitops @ choclab.net`

## `progressive-delivery`

Building `Weaveworks Enterprise` starts in the progressive delivery repo which
we need for the UI component. If you don't have this repository, check it out
from <https://github.com/weaveworks/progressive-delivery/>

### Building

I found this repo to be quite out of date and the build process did not work
terribly well in local development.

Most of the changes in this repo revolved around the Makefile. If the existing
weaveworks process does not work for you, try merging this commit from my fork
<https://github.com/mproffitt/progressive-delivery/commit/cae82590e7c2dae62971e001056f010f1a974dab>

You will need the `envsubst` command for this commit to work. If you're on mac
and this command cannot be found, try `brew install envsubst`.

To publish you'll need to update `ui/lib/package.json` to point to your own
NPM repo instead of the `weaveworks` repo. In my fork I've hosted this at
`@choclab` and the access is public.

To build, then run:

```sh
rm ui/lib/package-lock.json
make dependencies
make publish-js-lib
```

## `weave-gitops`

Similar to `progressive-delivery` we need the OSS UI library.

This is a lot simpler to build and publish.

Change the `package.json` as above to point at your NPM repo and then:

```sh
rm -rf dist/*
make node_modules
make ui-lib
npm publish dist/ --access=public
```

If your system complains about `parcel` - try running the following independently

```sh
yarn config set network-timeout 600000 && yarn --frozen-lockfile
```

### `weave-gitops-enterprise`

Before you can build the enterprise UI, you need to make changes to the code.

#### UI components

Replace all instances of `@weaveworks` with the repository you published the two
libraries above to.

```sh
cd ui
for file in $(grep -r '@weaveworks' | awk -F: '{print $1}'); do sed -i 's/@weaveworks/@mproffitt/g' $file; done
cd ..
```

Update `package.json` and replace the same.

Next, we need to regenerate the lockfile `yarn.lock`

```sh
export GITHUB_TOKEN=<your github token>
yarn install
```

### Disable licensing entitlement

If you haven't already, before you can build the docker images you must remove
the `entitlement` calls.

I've taken a fairly light approach to doing this by not removing it completely
but setting it to be `time.Now().AddDate(1, 0, 0)` (now + 1 year).

If you're following these instructions and [#PR-3752](https://github.com/weaveworks/weave-gitops-enterprise/pull/3752)
has not been merged, you need to merge the following branch:

<https://github.com/mproffitt/weave-gitops-enterprise/tree/remove-entitlement>

### Docker UI fix

When running in a more secure environment, all containers need to be run as
non-root.

This breaks the UI container used as an init container.

To fix this, edit the `ui/Dockerfile` and change the `COPY` command for `/html` as follows:

```Dockerfile
COPY --from=build /home/node/build /html
```

becomes:

```Dockerfile
COPY --from=build --chown=1000:1000 /home/node/build /html
```

We also need to update the chart to add a security context. As a convenience
this can be found on on my fork at this commit: [909ffa2](https://github.com/mproffitt/weave-gitops-enterprise/commit/909ffa27e2a302fca51246637d8b46d36ec34aa6)

### Building images

Now we should be able to build the `mccp` server components. This step should
build 2 docker images.

```sh
export DOCKER_BUILDKIT=1
make
```

The Makefile didn't seem to publish both images correctly so this has been
"corrected" in commit [e34fdf5](https://github.com/mproffitt/weave-gitops-enterprise/commit/e34fdf5d486795cea98ef13187ab379d593c5676)

### charts

The sub-charts are currently configured to be pulled from a private OCI registry.

In this build, we update them to pull from localhost, one level above the repository
root.

This means you will require the following checked out and built.

cluster-bootstrap-controller
cluster-reflector-controller
templates-controller
pipeline-controller
gitopssets-controller

Edit `charts/mccp/Chart.yaml` and change the repositories to point to the
correct filepath.

#### Example

```yaml
  - name: pipeline-controller
    version: "0.22.0"
    #repository: "oci://ghcr.io/weaveworks/charts"
    repository: file://../../../pipeline-controller/charts/pipeline-controller
    condition: enablePipelines
  - name: gitopssets-controller
    version: "0.16.5"
    # repository: "oci://ghcr.io/weaveworks/charts"
    repository: file://../gitopssets-controller
    condition: gitopssets-controller.enabled
  - name: cluster-reflector-controller
    version: "0.1.0"
    repository: file://../../../cluster-reflector-controller/charts/cluster-reflector-controller
    #repository: "oci://ghcr.io/weaveworks/charts"
    condition: cluster-reflector-controller.enabled
  - name: cluster-bootstrap-controller
    version: "0.1.0"
    #repository: "oci://ghcr.io/weaveworks/charts"
    repository: file://../../../cluster-bootstrap-controller/charts/cluster-bootstrap-controller
    condition: cluster-bootstrap-controller.enabled
```

## Controllers

### `pipeline-controller`

Edit the dockerfile and remove the `netrc` RUN directive, replacing it with

```Dockerfile
RUN go mod download
```

Edit the `Makefile` and set `IMG_REGISTRY` to your registry and `IMG` to your
repository on that registry.

For example:

```Makefile
IMG_REGISTRY ?= docker.io
IMG ?= $(IMG_REGISTRY)/choclab/pipeline-controller:$(IMG_TAG)
```

Edit the push command to remove either the `arm64` or `amd64` directive as
appropriate for your platform.

```Makefile
.PHONY: docker-push
docker-push: DOCKER_BUILD_ARGS=--push --platform linux/arm64/v8,linux/amd64
docker-push: docker-build
```

Now build and push the image

```sh
make docker-build
make docker-push
```

### `cluster-reflector-controller`

Edit the `Makefile` and set the `IMG` to your registry

```Makefile
IMG ?= docker.io/choclab/cluster-reflector-controller:${VERSION}
```

Next build and push the image

```sh
make docker-build
make docker-push
```

and build the chart

```sh
make helm
```

### `cluster-bootstrap-controller`

Edit the `Makefile` and set the `IMAGE_TAG_BASE` to your registry

```Makefile
IMAGE_TAG_BASE ?= docker.io/choclab/cluster-bootstrap-controller
```

Next build and push the image

```sh
make docker-build
make docker-push
```
