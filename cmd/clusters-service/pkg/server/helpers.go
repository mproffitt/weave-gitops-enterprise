package server

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"text/template"

	"github.com/spf13/viper"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/util/sets"

	capiv1 "github.com/weaveworks/templates-controller/apis/capi/v1alpha2"
	apitemplates "github.com/weaveworks/templates-controller/apis/core"
	"github.com/weaveworks/weave-gitops-enterprise/cmd/clusters-service/pkg/templates"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/git"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func parseGvk(gvk string) (*schema.GroupVersionKind, error) {
	var (
		p      string            = `(?P<k>[a-z0-9]+)\.?(?P<g>([a-z0-9.]+)*)?(/?(?P<v>v\d+.*))?`
		re     *regexp.Regexp    = regexp.MustCompile(p)
		match  []string          = re.FindStringSubmatch(gvk)
		result map[string]string = make(map[string]string)

		group, version, kind string
	)

	if len(match) == 0 {
		return nil, fmt.Errorf("failed to parse gvk from string %s", gvk)
	}

	{
		for i, name := range re.SubexpNames() {
			if i != 0 && name != "" {
				result[name] = match[i]
			}
		}
		fmt.Printf("\n\n  %+v \n\n", result)
		group = result["g"]
		version = result["v"]
		kind = result["k"]

		if version == "" {
			version = "v1"
		}
	}

	return &schema.GroupVersionKind{
		Group:   group,
		Version: version,
		Kind:    kind,
	}, nil
}

func renderTemplateWithValues(t apitemplates.Template, name, namespace string, values map[string]string, mapper meta.RESTMapper) ([]templates.RenderedTemplate, error) {
	opts := []templates.RenderOptFunc{
		templates.InjectLabels(map[string]string{
			"templates.weave.works/template-name":      name,
			"templates.weave.works/template-namespace": viper.GetString("capi-templates-namespace"),
		}),
	}

	if mapper != nil {
		opts = append(opts, templates.InNamespace(namespace, mapper))
	}

	if shouldInjectPruneAnnotation(t) {
		opts = append(opts, templates.InjectPruneAnnotation)
	}

	processor, err := templates.NewProcessorForTemplate(t)
	if err != nil {
		return nil, err
	}

	templateBits, err := processor.RenderTemplates(values, opts...)
	if err != nil {
		if missing, ok := isMissingVariableError(err); ok {
			return nil, fmt.Errorf("error rendering template %v due to missing variables: %s", name, missing)
		}
		return nil, fmt.Errorf("error rendering template %v, %v", name, err)
	}

	return templateBits, nil
}

func renderTemplateStringWithValues(t string, values map[string]string) (string, error) {
	tpl, err := template.New("__string").Parse(t)
	if err != nil {
		return "", fmt.Errorf("failed to parse resource template definition: %w", err)
	}

	var s bytes.Buffer
	err = tpl.Execute(&s, values)
	if err != nil {
		return "", fmt.Errorf("failed to render resource template definition path: %w", err)
	}
	return s.String(), nil
}

func shouldInjectPruneAnnotation(t apitemplates.Template) bool {
	anno := t.GetAnnotations()[templates.InjectPruneAnnotationAnnotation]
	if anno != "" {
		return anno == "true"
	}

	// FIXME: want to phase configuration option out. You can enable per template by adding the annotation
	return viper.GetString("inject-prune-annotation") != "disabled" && isCAPITemplate(t)
}

func getProvider(t apitemplates.Template, annotation string) string {
	meta, err := templates.ParseTemplateMeta(t, annotation)

	if err != nil {
		return ""
	}

	for _, obj := range meta.Objects {
		if p, ok := providers[obj.Kind]; ok {
			return p
		}
	}

	return ""
}

func isMissingVariableError(err error) (string, bool) {
	errStr := err.Error()
	prefix := "processing template: value for variables"
	suffix := "is not set. Please set the value using os environment variables or the clusterctl config file"
	if strings.HasPrefix(errStr, prefix) && strings.HasSuffix(errStr, suffix) {
		missing := strings.TrimSpace(errStr[len(prefix):strings.Index(errStr, suffix)])
		return missing, true
	}
	return "", false
}

func getClusterNamespace(clusterNamespace string) string {
	namespace := "default"
	if clusterNamespace == "" {
		ns := viper.GetString("capi-clusters-namespace")
		if ns != "" {
			namespace = ns
		}

	} else {
		namespace = clusterNamespace
	}
	return namespace
}

func isCAPITemplate(t apitemplates.Template) bool {
	return t.GetObjectKind().GroupVersionKind().Kind == capiv1.Kind
}

func filePaths(files []git.CommitFile) []string {
	names := []string{}
	for _, f := range files {
		names = append(names, f.Path)
	}
	return names
}

// Check if there are files in originalFiles that are missing from extraFiles and returns them
func getMissingFiles(originalFiles []git.CommitFile, extraFiles []git.CommitFile) []git.CommitFile {
	originalFilePaths := filePaths(originalFiles)
	extraFilePaths := filePaths(extraFiles)

	diffPaths := sets.NewString(originalFilePaths...).Difference(sets.NewString(extraFilePaths...)).List()

	removedFilenames := []git.CommitFile{}
	for i := range diffPaths {
		removedFilenames = append(removedFilenames, git.CommitFile{
			Path:    diffPaths[i],
			Content: nil,
		})
	}

	return removedFilenames

}
