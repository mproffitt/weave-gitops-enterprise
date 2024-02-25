package server

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	capiv1 "github.com/weaveworks/templates-controller/apis/capi/v1alpha2"
	apitemplates "github.com/weaveworks/templates-controller/apis/core"
	gapiv1 "github.com/weaveworks/templates-controller/apis/gitops/v1alpha2"
	capiv1_proto "github.com/weaveworks/weave-gitops-enterprise/cmd/clusters-service/pkg/protos"
	"github.com/weaveworks/weave-gitops-enterprise/cmd/clusters-service/pkg/templates"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	lbls "k8s.io/apimachinery/pkg/labels"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const TemplateTypeLabel = "weave.works/template-type"
const filterPattern = `{{\s*(?P<gvk>(\w+\.?)+(/\w+)?)\s*?((` +
	`filterPrefix=(?P<p>["']?[^\s]+["']?))?\s*?(` +
	`filterSuffix=(?P<s>["']?[^\s]+["']?))?\s*?(` +
	`namespace=(?P<n>["']?[^\s]+["']?))?\s*?(` +
	`matchLabels=(?P<l>((["']?[^\s]+["']?)|(["'][^"']+["']))+))?` +
	`)*?\s*?}}`

func ToTemplateResponse(t apitemplates.Template, client client.Client) *capiv1_proto.Template {
	var annotation string
	templateKind := t.GetObjectKind().GroupVersionKind().Kind
	switch templateKind {
	case capiv1.Kind:
		annotation = templates.CAPIDisplayNameAnnotation
	case gapiv1.Kind:
		annotation = templates.GitOpsTemplateNameAnnotation
	}

	templateType := t.GetLabels()[TemplateTypeLabel]

	res := &capiv1_proto.Template{
		Name:         t.GetName(),
		Description:  t.GetSpec().Description,
		Provider:     getProvider(t, annotation),
		Annotations:  t.GetAnnotations(),
		Labels:       t.GetLabels(),
		TemplateKind: templateKind,
		TemplateType: templateType,
		Namespace:    t.GetNamespace(),
	}

	meta, err := templates.ParseTemplateMeta(t, annotation)
	if err != nil {
		res.Error = fmt.Sprintf("Couldn't load template body: %s", err.Error())
		return res
	}

	for _, p := range meta.Params {
		options, err := optionsFromTemplateId(p.Options, client)
		if err != nil {
			res.Error = fmt.Sprintf("Couldn't load options from template: %s", err.Error())
			//return res
		}
		res.Parameters = append(res.Parameters, &capiv1_proto.Parameter{
			Name:        p.Name,
			Description: p.Description,
			Options:     options,
			Required:    p.Required,
			Default:     p.Default,
		})
	}
	for _, o := range meta.Objects {
		res.Objects = append(res.Objects, &capiv1_proto.TemplateObject{
			Kind:        o.Kind,
			ApiVersion:  o.APIVersion,
			Parameters:  o.Params,
			Name:        o.Name,
			DisplayName: o.DisplayName,
		})
	}

	res.Profiles, err = templates.GetProfilesFromTemplate(t)
	if err != nil {
		res.Error = fmt.Sprintf("Couldn't load profiles from template: %s", err.Error())
		return res
	}

	return res
}

// optionsFromTemplateId returns a list of options requested by the template.
//
// When defining options on the template, this is normally a static list of items
// that the user can choose from. However, it is also possible to define a list
// of items that are dynamically generated from the cluster. This is done by
// defining a filter on the template detailing what resource kind to list optionally
// additionally filtered by namespace, prefix and suffix.
//
// The filter is defined as a go template string, and the following variables are
// available:
//   - the group, version and kind of the resource to list
//     (e.g. "deployment.apps/v1" or "namespace")
//   - namespace: the namespace to list resources from
//   - filterPrefix: the prefix to filter resources by
//   - filterSuffix: the suffix to filter resources by
//   - matchLabels: a string representation of a map of labels to match
//
// Where matchLabels is used, this must be a pipe `|` seperated list either of
// key=value pairs (e.g. "app=nginx|env=production") or a valid label selector
// string (e.g. "app=x in (foo,,baz),y,z notin ()").

func optionsFromTemplateId(id []string, c client.Client) (options []string, err error) {
	options = make([]string, 0)
	// predefined options
	if len(id) != 1 || !strings.HasPrefix(id[0], "{{") {
		return id, nil
	}

	var (
		filter                    string = id[0]
		namespace, prefix, suffix string

		re     *regexp.Regexp    = regexp.MustCompile(filterPattern)
		match  []string          = re.FindStringSubmatch(filter)
		result map[string]string = make(map[string]string)
		ok     bool

		listOptions client.ListOptions = client.ListOptions{}
	)

	if len(match) == 0 {
		return options, fmt.Errorf("failed to parse filter from string %s", filter)
	}

	{
		for i, name := range re.SubexpNames() {
			if i != 0 && name != "" {
				result[name] = match[i]
			}
		}
	}

	if filter, ok = result["gvk"]; !ok {
		return options, fmt.Errorf("failed to parse gvk from filter %s", filter)
	}

	if prefix, ok = result["p"]; !ok {
		prefix = ""
	}

	if suffix, ok = result["s"]; !ok {
		suffix = ""
	}

	if namespace, ok = result["n"]; !ok {
		namespace = ""
	}

	// If `matchLabels` is defined, we need to parse it and apply it to the list
	// options.
	{
		var (
			labelString string
			labels      map[string]string = make(map[string]string)
		)
		if labelString, ok = result["l"]; ok && labelString != "" {
			for _, label := range strings.Split(labelString, "|") {
				label = strings.NewReplacer("\"", "", "'", "").Replace(label)
				parts := strings.Split(label, "=")
				if len(parts) == 1 {
					// This is a label selector string
					selector, err := lbls.Parse(label)
					if err != nil {
						return options, fmt.Errorf("invalid label selector: %s", label)
					}

					if listOptions.LabelSelector == nil {
						listOptions.LabelSelector = selector
					} else {
						req, sel := selector.Requirements()
						if sel {
							listOptions.LabelSelector.Add(req...)
						}
					}
				} else if len(parts) != 2 {
					return options, fmt.Errorf("invalid label format: %s", label)
				}
			}
		}
		if len(labels) > 0 {
			var matcher client.MatchingLabels = labels
			matcher.ApplyToList(&listOptions)
		}
	}

	gvk, err := parseGvk(filter)
	if err != nil {
		return options, fmt.Errorf("optionsFromTemplate: %w", err)
	}

	apiVersion := gvk.GroupVersion().String()

	object := unstructured.UnstructuredList{}
	{
		object.SetAPIVersion(apiVersion)
		object.SetGroupVersionKind(*gvk)
		object.SetKind(gvk.Kind)

		if namespace != "" {
			listOptions.Namespace = namespace
		}

		err = c.List(context.Background(), &object, &listOptions)
		if err != nil {
			fmt.Printf("failed to list resources: %v '%s' %+v %+v\n\n", err, apiVersion, gvk, listOptions)
			return options, fmt.Errorf("failed to list resources: %w", err)
		}
	}

	for _, item := range object.Items {
		name := item.GetName()
		fmt.Println("name: ", name)

		if prefix == "" && suffix == "" {
			options = append(options, name)
		} else {
			if strings.HasPrefix(name, prefix) && prefix != "" {
				options = append(options, name)
			} else if strings.HasSuffix(name, suffix) && suffix != "" {
				options = append(options, name)
			}
		}
	}

	return options, nil
}
