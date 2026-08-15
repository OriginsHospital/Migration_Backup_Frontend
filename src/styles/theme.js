import {
  createTheme,
  alpha,
  getContrastRatio,
  responsiveFontSizes,
} from '@mui/material/styles'

const violetBase = '#7F00FF'
const violetMain = alpha(violetBase, 0.7)

// Create a theme instance.
let theme = createTheme()

const salmon = theme.palette.augmentColor({
  color: {
    main: '#FF5733',
  },
  name: 'salmon',
})

theme = createTheme({
  palette: {
    primary: {
      main: '#06aee9',
      dark: '#b0e9fa',
      light: '#06aee9',
    },
    secondary: {
      main: '#b0e9fa',
      contrastText: '#06aee9',
    },
    button: {
      main: '#b0e9fa',
    },
    description: {
      primary: '#637580',
    },
    ochre: {
      main: '#E3D026',
      light: '#E9DB5D',
      dark: '#A29415',
      contrastText: '#242105',
    },
    violet: {
      main: violetMain,
      light: alpha(violetBase, 0.5),
      dark: alpha(violetBase, 0.9),
      contrastText:
        getContrastRatio(violetMain, '#fff') > 4.5 ? '#fff' : '#111',
    },
    salmon: salmon,
  },
})

theme = responsiveFontSizes(theme)

export default theme
