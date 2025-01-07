import { Table, TableBody, TableOwnProps } from '@mui/material';
import React from 'react';
import styled from 'styled-components';
import { KeyValueRow } from '../../RowHeader';

const DynamicTable = ({
  obj,
  tableSize,
  classes,
}: {
  obj: object;
  tableSize?: TableOwnProps['size'];
  classes?: string;
}) => {
  return (
    <Table size={tableSize || 'small'} className={classes}>
      <TableBody>
        {Object.entries(obj).map((entry, index) => (
          <KeyValueRow entryObj={entry} key={index}></KeyValueRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default styled(DynamicTable)``;
