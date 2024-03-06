#!/bin/bash

for f in $(grep -rn --col "from '.*gitops.d;" ui | cut -d: -f1); do
    path="$(dirname $f | sed 's#ui/src/##' | sed 's/[a-zA-Z_]*/../g')";
    sed -i "s#from '.*gitops.d#from '$path/gitops.d'#g" $f;
done

