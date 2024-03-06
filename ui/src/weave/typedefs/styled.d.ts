/* eslint-disable */
import "styled-components";
import { ThemeTypes } from "../contexts/AppContext";
export namespace colors {
  var black: string;
  var white: string;
  var primary: string;
  var primaryLight05: string;
  var primaryLight10: string;
  var primary10: string;
  var primary20: string;
  var primary30: string;
  var alertLight: string;
  var alertOriginal: string;
  var alertMedium: string;
  var alertDark: string;
  var neutralGray: string;
  var pipelineGray: string;
  var neutral00: string;
  var neutral10: string;
  var neutral20: string;
  var neutral30: string;
  var neutral40: string;
  var whiteToPrimary: string;
  var grayToPrimary: string;
  var neutral20ToPrimary: string;
  var backGray: string;
  var pipelinesBackGray: string;
  var blueWithOpacity: string;
  var feedbackLight: string;
  var feedbackMedium: string;
  var feedbackOriginal: string;
  var feedbackDark: string;
  var successLight: string;
  var successMedium: string;
  var successOriginal: string;
  var successDark: string;
  var defaultLight: string;
  var defaultMedium: string;
  var defaultOriginal: string;
  var defaultDark: string;
}

export namespace spacing {
  var base: string;
  var large: string;
  var medium: string;
  var none: string;
  var small: string;
  var xl: string;
  var xs: string;
  var xxl: string;
  var xxs: string;
}

export namespace fontSizes {
  var huge: string;
  var extraLarge: string;
  var large: string;
  var medium: string;
  var small: string;
  var tiny: string;
}

export namespace borderRadius {
  var circle: string;
  var none: string;
  var soft: string;
}

export namespace boxShadow {
  var light: string;
  var none: string;
}

declare module "styled-components" {
  export interface DefaultTheme {
    fontFamilies: { regular: string; monospace: string };
    fontSizes: typeof fontSizes;
    colors: typeof colors;
    spacing: typeof spacing;
    borderRadius: typeof borderRadius;
    boxShadow: typeof boxShadow;
    mode: ThemeTypes;
  }
}
