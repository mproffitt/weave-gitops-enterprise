import { createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import { ThemeTypes } from './weave/contexts/AppContext';
// import { muiTheme as coreMuiTheme, ThemeTypes } from './gitops.d';
import { muiTheme as coreMuiTheme } from './weave/lib/theme';

const defaultTheme = createTheme();

export const muiTheme = (colors: any, mode: ThemeTypes) => {
  const theme = coreMuiTheme(colors, mode);
  const overrides = createTheme({
    ...theme,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            minWidth: 52,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          root: {
            padding: 0,
          },
          paper: {
            padding: 0,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            margin: 0,
            padding: defaultTheme.spacing(0, 2, 2, 2),
            justifyContent: 'flex-end',
          },
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: defaultTheme.spacing(2, 2, 0, 2),
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: defaultTheme.spacing(1, 2, 2, 2),
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            flexGrow: 1,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            width: '100%',
          },
          icon: {
            color: colors.black,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            color: colors.neutral30,
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          select: {
            fontSize: 14,
          },
          toolbar: {
            color: defaultTheme.palette.text.secondary,
            minHeight: 0,
          },
        },
      },
      MuiCardActions: {
        styleOverrides: {
          root: {
            justifyContent: 'center',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          formControl: {
            transform: 'none',
          },
        },
      },
    },
    shape: {
      borderRadius: 2,
    },
  });
  return createTheme(deepmerge(theme, overrides));
};
