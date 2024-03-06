# React v17 to v18 migration required forked modules

During the migration of this project to React 18.2.0, the following upstream
libraries failed to render correctly

- `property-information`

  This library is a dependency of `react-markdown` used to render markdown
  elements within this UI. It has a map `hastToReact` which did not export
  correctly, resulting in the error `_propertyInformation.hastToReact is undefined`
  which caused the entire application to crash.

  This fork of the module exports `hastToReact` correctly.
