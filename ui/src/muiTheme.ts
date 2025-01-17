import { createTheme } from '@material-ui/core/styles';
import { muiTheme as coreMuiTheme } from '@choclab/weave-gitops';
import { ThemeTypes } from '@choclab/weave-gitops/ui/contexts/AppContext';

const defaultTheme = createTheme();

export const muiTheme = (colors: any, mode: ThemeTypes) => {
  const theme = coreMuiTheme(colors, mode);
  return createTheme({
    ...theme,
    overrides: {
      ...theme.overrides,
      MuiButton: {
        ...theme.overrides?.MuiButton,
        root: {
          ...theme.overrides?.MuiButton?.root,
          minWidth: 52,
        },
      },
      MuiDialog: {
        root: {
          padding: 0,
        },
        paper: {
          padding: 0,
        },
      },
      MuiDialogActions: {
        root: {
          margin: 0,
          padding: defaultTheme.spacing(0, 2, 2, 2),
          justifyContent: 'flex-end',
        },
      },
      MuiDialogTitle: {
        root: {
          padding: defaultTheme.spacing(2, 2, 0, 2),
        },
      },
      MuiDialogContent: {
        root: {
          padding: defaultTheme.spacing(1, 2, 2, 2),
        },
      },
      MuiInputBase: {
        root: {
          flexGrow: 1,
        },
      },
      MuiSelect: {
        select: {
          width: '100%',
        },
        icon: {
          color: colors.black,
        },
      },
      MuiTableCell: {
        head: {
          color: colors.neutral30,
        },
      },
      MuiTablePagination: {
        select: {
          fontSize: 14,
        },
        toolbar: {
          color: defaultTheme.palette.text.secondary,
          minHeight: 0,
        },
      },
      MuiCardActions: {
        root: {
          justifyContent: 'center',
        },
      },
      MuiInputLabel: {
        formControl: {
          transform: 'none',
        },
      },
    },
    shape: {
      borderRadius: 2,
    },
  });
};
