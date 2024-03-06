import { Checkbox, CheckboxProps } from "@mui/material";
import * as React from "react";
import styled from "styled-components";
import FormInput, { FormInputProps } from "./FormInput";
import { JSX } from "react/jsx-runtime";

type Props = FormInputProps;

function FormCheckbox(props: Props) {
  return (
    <FormInput
      {...props}
      //   Convert to bool to satisfy mui Checkbox props
      component={(p: JSX.IntrinsicAttributes & CheckboxProps) => (
        <Checkbox {...p} checked={p.checked || Boolean(p.checked)} />
      )}
      valuePropName="checked"
    />
  );
}

export default styled(FormCheckbox).attrs({ className: FormCheckbox.name })``;
