# `package.json`

Inside `package.json` are a number of aliases.

When running outside of a container, these are not required, and instead an
entry can be added for the parcel-resolver:

```json
{
  "@parcel/resolver-default": {
    "packageExports": true
  }
}
```

This works fine for local development however when loaded into a container, a
runtime error appears in the console along with a blank page. See [weave-gitops #3637]
and [parcel #8792]

This issue is caused by `yaml` module declaring a mix of dependency types which
cannot be resolved correctly by `parcel`.

The original solution used for `weave-gitops` was to add an alias for this:

```json
{
    "alias": {
        "yaml": "yaml/browser/dist/index.js"
    }
}
```

When using `@parcel/resolver-default` with `packageExports: true`, this will not
work (see [Parcel - New resolver]).

Unfortunately, due to dependency changes following the upgrade, this requres
additional aliases to be required.

```json
{
  "devlop": "devlop/lib/default.js",
  "vfile/do-not-use-conditional-minpath": "vfile/lib/minpath.browser.js",
  "vfile/do-not-use-conditional-minproc": "vfile/lib/minproc.browser.js",
  "vfile/do-not-use-conditional-minurl": "vfile/lib/minurl.browser.js",
  "unist-util-visit-parents/do-not-use-color": "unist-util-visit-parents/lib/color.js",
  "yaml": "yaml/browser/dist"
}
```

> **Note** It is likely that these will break in the future should `parcel`
> enable `packageExports` by default.

As `yaml` is the primary culprit in this scenario, it is worth either fixing
upstream or finding a suitable replacement.

From the `yaml` package, only two methods are used:

- `stringify`
- `parse`

The other aliased dependencies (`devlop`, `vfile`, `unist-util-visit-parents`)
are all dependencies of `react-markdown` which is also [known to cause problems].

[weave-gitops #3637]: https://github.com/weaveworks/weave-gitops/issues/3637
[Parcel - New resolver]: https://v2.parceljs.cn/blog/v2-9-0/#new-resolver
[Parcel #8792]: https://github.com/parcel-bundler/parcel/issues/8792
[known to cause problems]: ./jslib/README.md
