.PHONY: all check clean dependencies images install lint ui-audit ui-build-for-tests unit-tests update-mccp-chart-values proto echo-ldflags update-weave-gitops tools
.DEFAULT_GOAL := all

# Boiler plate for bulding Docker containers.
# All this must go at top of file I'm afraid.
BUILD_TIME?=$(shell date +'%Y-%m-%d_%T')
IMAGE_PREFIX := docker.io/choclab/weave-gitops-enterprise-
IMAGE_TAG := $(shell tools/image-tag)
GIT_REVISION := $(shell git rev-parse HEAD)
CORE_REVISION := $(shell grep 'weaveworks/weave-gitops ' $(PWD)/go.mod | cut -d' ' -f2 | cut -d '-' -f3)
VERSION=$(shell git describe --always --match "v*" --abbrev=7)
WEAVE_GITOPS_VERSION=$(shell git describe --always --match "v*" --abbrev=7 | sed 's/^[^0-9]*//')
TIME_NOW=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
CURRENT_DIR := $(shell pwd)
UPTODATE := .uptodate
GOOS := $(shell go env GOOS)
TIER=enterprise
BRANCH?=main

UI_SERVER := $(IMAGE_PREFIX)ui-server
CLUSTER_SERVICE := $(IMAGE_PREFIX)clusters-service

IMAGE_NAMES := $(UI_SERVER) $(CLUSTER_SERVICE)

ifeq ($(GOOS),linux)
	cgo_ldflags=-linkmode external -w -extldflags "-static"
else
	# darwin doesn't like -static
	cgo_ldflags=-linkmode external -w
endif

# The GOOS to use for local binaries that we `make install`
LOCAL_BINARIES_GOOS ?= $(GOOS)

# Every directory with a Dockerfile in it builds an image called
# $(IMAGE_PREFIX)<dirname>. Dependencies (i.e. things that go in the image)
# still need to be explicitly declared.
%/$(UPTODATE): %/Dockerfile %/*
	$(SUDO) docker build \
		--build-arg=version=$(VERSION) \
		--build-arg=image_tag=$(IMAGE_TAG) \
		--build-arg=revision=$(GIT_REVISION) \
		--build-arg=now=$(TIME_NOW) \
		--tag $(IMAGE_PREFIX)$(shell basename $(@D)) \
		$(@D)/
	$(SUDO) docker tag $(IMAGE_PREFIX)$(shell basename $(@D)) $(IMAGE_PREFIX)$(shell basename $(@D)):$(IMAGE_TAG)
	touch $@

# Takes precedence over the more general rule above
# The only difference is the build context
cmd/clusters-service/$(UPTODATE): cmd/clusters-service/Dockerfile cmd/clusters-service/*
	$(SUDO) docker build \
		--build-arg=version=$(WEAVE_GITOPS_VERSION) \
		--build-arg=image_tag=$(IMAGE_TAG) \
		--build-arg=revision=$(GIT_REVISION) \
		--build-arg=GITHUB_BUILD_TOKEN=$(GITHUB_BUILD_TOKEN) \
		--build-arg=now=$(TIME_NOW) \
		--tag $(IMAGE_PREFIX)$(shell basename $(@D)) \
		--file cmd/clusters-service/Dockerfile \
		.
	$(SUDO) docker tag $(IMAGE_PREFIX)$(shell basename $(@D)) $(IMAGE_PREFIX)$(shell basename $(@D)):$(IMAGE_TAG)
	touch $@



ui/.uptodate: ui/*
	$(SUDO) docker build \
		--build-arg=version=$(WEAVE_GITOPS_VERSION) \
		--build-arg=revision=$(GIT_REVISION) \
		--build-arg=GITHUB_TOKEN=$(GITHUB_BUILD_TOKEN) \
		--build-arg=now=$(TIME_NOW) \
		--tag $(UI_SERVER) \
		--file ui/Dockerfile \
		.
	$(SUDO) docker tag $(UI_SERVER) $(UI_SERVER):$(IMAGE_TAG)
	touch $@

update-mccp-chart-values:
	sed -i "s|clustersService: docker.io/weaveworks/weave-gitops-enterprise-clusters-service.*|clustersService: docker.io/choclab/weave-gitops-enterprise-clusters-service:$(IMAGE_TAG)|" $(CHART_VALUES_PATH)
	sed -i "s|uiServer: docker.io/weaveworks/weave-gitops-enterprise-ui-server.*|uiServer: docker.io/choclab/weave-gitops-enterprise-ui-server:$(IMAGE_TAG)|" $(CHART_VALUES_PATH)

# Get a list of directories containing Dockerfiles
DOCKERFILES := $(shell find . \
	-name tools -prune -o \
	-name vendor -prune -o \
	-name rpm -prune -o \
	-name build -prune -o \
	-name environments -prune -o \
	-name test -prune -o \
	-name examples -prune -o \
	-name node_modules -prune -o \
	-name wks-ci -prune -o \
	-type f -name 'Dockerfile' -print)
UPTODATE_FILES := $(patsubst %/Dockerfile,%/$(UPTODATE),$(DOCKERFILES))
images:
	$(info $(IMAGE_NAMES))
	@echo > /dev/null


# Define imagetag-golang, etc, for each image, which parses the dockerfile and
# prints an image tag. For example:
#     FROM golang:1.8.1-stretch
# in the "foo/Dockerfile" becomes:
#     $ make imagetag-foo
#     1.8.1-stretch
define imagetag_dep
.PHONY: imagetag-$(1)
$(patsubst $(IMAGE_PREFIX)%,imagetag-%,$(1)): $(patsubst $(IMAGE_PREFIX)%,%,$(1))/Dockerfile
	@cat $$< | grep "^FROM " | head -n1 | sed 's/FROM \(.*\):\(.*\)/\2/'
endef
$(foreach image, $(IMAGE_NAMES), $(eval $(call imagetag_dep, $(image))))

all: $(UPTODATE_FILES) binaries

check: all lint unit-tests ui-audit

BINARIES = \
	$(NULL)

binaries: $(BINARIES)

# Start tilt to do development with wge running on the cluster
cluster-dev: helm-dependency-build
	PATH=${PWD}/tools/bin:${PATH} ./tools/bin/tilt up

.PHONY: helm-dependency-build
helm-dependency-build:
	./tools/bin/helm repo add weaveworks-policy-agent https://weaveworks.github.io/policy-agent
	./tools/bin/helm dependency build ./charts/mccp

godeps=$(shell go list -deps -f '{{if not .Standard}}{{$$dep := .}}{{range .GoFiles}}{{$$dep.Dir}}/{{.}} {{end}}{{end}}' $1)

dependencies: ## Install build dependencies
	$(CURRENT_DIR)/tools/download-deps.sh $(CURRENT_DIR)/tools/dependencies.toml
	@go install github.com/grpc-ecosystem/protoc-gen-grpc-gateway-ts

lint:
	bin/go-lint
	@go install github.com/yoheimuta/protolint/cmd/protolint@latest
	protolint lint -config_path=.protolint.yaml ./api ./cmd/clusters-service/api

cmd/clusters-service/clusters-service: $(cmd find cmd/clusters-service -name '*.go') common/** pkg/**
	CGO_ENABLED=1 go build -ldflags "-X github.com/weaveworks/weave-gitops-enterprise/cmd/clusters-service/pkg/version.Version=$(WEAVE_GITOPS_VERSION) -X github.com/weaveworks/weave-gitops-enterprise/pkg/version.ImageTag=$(IMAGE_TAG) $(cgo_ldflags)" -tags netgo -o $@ ./cmd/clusters-service


CMD_GITOPS_LDFLAGS?=-X github.com/weaveworks/weave-gitops/cmd/gitops/version.Branch=$(BRANCH) \
				 -X github.com/weaveworks/weave-gitops/cmd/gitops/version.BuildTime=$(BUILD_TIME) \
				 -X github.com/weaveworks/weave-gitops/cmd/gitops/version.GitCommit=$(GIT_REVISION) \
				 -X github.com/weaveworks/weave-gitops/cmd/gitops/version.Version=$(VERSION)

cmd/gitops/gitops: cmd/gitops/main.go $(shell find cmd/gitops -name "*.go")
	CGO_ENABLED=0 go build -ldflags "$(CMD_GITOPS_LDFLAGS)" -gcflags='all=-N -l' -o $@  ./cmd/gitops

update-weave-gitops:
	$(eval SHORTHASH := $(shell curl -q 'https://api.github.com/repos/weaveworks/weave-gitops/branches/$(BRANCH)' | jq -r '.commit.sha[:8]'))
	GOPRIVATE=github.com/weaveworks go get -d github.com/weaveworks/weave-gitops@$(SHORTHASH) && go mod tidy
	$(eval NPM_VERSION := $(shell yarn info @weaveworks/weave-gitops-main time --json | jq -r '.data | keys | .[] | select(contains("$(SHORTHASH)"))'))
	yarn add @weaveworks/weave-gitops@npm:@weaveworks/weave-gitops-main@$(NPM_VERSION)

# We select which directory we want to descend into to not execute integration
# tests here.
unit-tests-with-coverage: $(GENERATED)
	go test -v -cover -coverprofile=.coverprofile ./cmd/... ./pkg/...
	cd common && go test -v -cover -coverprofile=.coverprofile ./...
	cd cmd/clusters-service && go test -v -cover -coverprofile=.coverprofile ./...

TEST_V?="-v"
unit-tests: $(GENERATED)
	go test $(TEST_V) ./cmd/... ./pkg/...
	cd common && go test $(TEST_V) ./...
	cd cmd/clusters-service && go test $(TEST_V) ./...

ui-build-for-tests:
	# Github actions npm is slow sometimes, hence increasing the network-timeout
	yarn config set network-timeout 300000 && yarn install && yarn build

integration-tests:
	$(CURRENT_DIR)/tools/download-deps.sh $(CURRENT_DIR)/tools/test-dependencies.toml
	go test -v ./cmd/clusters-service/... -tags=integration
	go test -v ./pkg/git/... -tags=integration
	go test -v ./pkg/query/... -tags=integration
	go test -v ./pkg/bootstrap/... -tags=integration


cli-acceptance-tests:
	$(CURRENT_DIR)/tools/download-deps.sh $(CURRENT_DIR)/tools/test-dependencies.toml
	go test -v ./cmd/gitops/app/... -tags=acceptance

clean:
	$(SUDO) docker rmi $(IMAGE_NAMES) >/dev/null 2>&1 || true
	$(SUDO) docker rmi $(patsubst %, %:$(IMAGE_TAG), $(IMAGE_NAMES)) >/dev/null 2>&1 || true
	rm -rf $(UPTODATE_FILES)
	rm -f $(BINARIES)
	rm -f $(GENERATED)
	rm -rf build

push:
	for IMAGE_NAME in $(IMAGE_NAMES); do \
		if ! echo $$IMAGE_NAME | grep build; then \
			docker push $$IMAGE_NAME:$(IMAGE_TAG); \
		fi \
	done

proto: ## Generate protobuf files
	PATH=${PWD}/tools/bin ./tools/bin/buf generate

fakes: ## Generate testing fakes
	go generate ./...

# --- UI

CALENDAR_VERSION=$(shell date +"%Y-%m")

.PHONY: node_modules
node_modules: package.json yarn.lock
	yarn config set network-timeout 300000 && yarn install --frozen-lockfile

ui-build: node_modules $(shell find ui/src -type f)
	REACT_APP_VERSION="$(CALENDAR_VERSION) $(VERSION)" yarn build

# This job assumes that the weave-gitops repo located next to this repo in the filesystem
core-ui:
	cd ../weave-gitops && \
	npm run build:lib && \
	npm run typedefs && \
	cd ../weave-gitops-enterprise

core-lib:
	rm -rf node_modules/@weaveworks/weave-gitops/
	rm -rf .parcel-cache/
	yarn add ../weave-gitops/dist

ui-audit:
	# Check js packages for any high or critical vulnerabilities
	yarn audit --level high; if [ $$? -gt 7 ]; then echo "Failed yarn audit"; exit 1; fi

# Run make swagger-docs and go to http://localhost:6001 to view the Swagger docs
# NOTE: Requires a running Docker Server

.PHONY: swagger-docs
swagger-docs:
	@echo "Swagger docs available at http://localhost:6001"
	docker run -p 6001:8080 \
	-e URLS="[ \
	{ name: \"clusters-service\", url: \"/clusters-service-api/cluster_services.swagger.json\"}, \
	{ name: \"gitopssets\", url: \"/api/gitopssets/gitopssets.swagger.json\"}, \
	{ name: \"terraform\", url: \"/api/terraform/terraform.swagger.json\"}, \
	{ name: \"gitauth\", url: \"/api/gitauth/gitauth.swagger.json\"}, \
	{ name: \"pipeline\", url: \"/api/pipelines/pipelines.swagger.json\"}, \
	{ name: \"query\", url: \"/api/query/query.swagger.json\"}, \
	]" \
	-v $(CURRENT_DIR)/cmd/clusters-service/api:/usr/share/nginx/html/clusters-service-api \
	-v $(CURRENT_DIR)/api:/usr/share/nginx/html/api \
	swaggerapi/swagger-ui

.PHONY: user-guide-apis
user-guide-apis:
	cp cmd/clusters-service/api/cluster_services.swagger.json ../weave-gitops/website/static/swagger/
	cp api/gitauth/gitauth.swagger.json ../weave-gitops/website/static/swagger/
	cp api/gitopssets/gitopssets.swagger.json ../weave-gitops/website/static/swagger/
	cp api/pipelines/pipelines.swagger.json ../weave-gitops/website/static/swagger/
	cp api/query/query.swagger.json ../weave-gitops/website/static/swagger/
	cp api/terraform/terraform.swagger.json ../weave-gitops/website/static/swagger/


FORCE:

echo-ldflags:
	@echo "$(CMD_GITOPS_LDFLAGS)"
