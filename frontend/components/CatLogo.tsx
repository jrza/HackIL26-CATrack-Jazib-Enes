import React from "react";
import Svg, { Path, Polygon } from "react-native-svg";

interface CatLogoProps {
  size?: number;
  letterColor?: string;
  triangleColor?: string;
}

export default function CatLogo({
  size = 24,
  letterColor = "#1A1A1A",
  triangleColor = "#FEC40E",
}: CatLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon
        fill={triangleColor}
        points="74.722,73.033 52.443,52.244 29.357,73.033"
      />
      <Path
        fill={letterColor}
        d="M34.514,64.826c1.685-1.567,1.975-3.504,1.975-5.244v-7.303h-9.16v9.908 c0,1.422-1.031,2.57-2.303,2.57c-1.271,0-2.219-1.148-2.219-2.57V34.112c0-1.417,0.947-2.567,2.219-2.567 c1.272,0,2.303,1.15,2.303,2.567v9.976h9.147V33.739c0-5.717-3.356-10.422-11.527-10.433c-8.392,0-11.564,4.727-11.564,10.444 v29.317c0,5.665,4.041,9.952,9.208,9.952h2.837L34.514,64.826z"
      />
      <Polygon
        fill={letterColor}
        points="70.623,65.977 70.623,33.758 64.301,33.758 64.301,24.269 87.178,24.269 87.178,33.758 80.826,33.758 80.826,72.962 78.114,72.962"
      />
      <Path
        fill={letterColor}
        d="M49.979,46.642l2.466-14.037l2.453,14.037H49.979z M58.798,24.318H46.037l-7.435,37.148 l13.846-12.446l14.434,13.471L58.798,24.318z"
      />
    </Svg>
  );
}
