'use client'
import { useSelector } from 'react-redux';
import Link from "next/link";
import { styled } from "@mui/material/styles";
import Image from "next/image";

const Logo = () => {
  const customizer = useSelector((state) => state.customizer);
  const LinkStyled = styled(Link)(() => ({
    height: customizer.TopbarHeight,
    width: customizer.isCollapse ? "40px" : "180px",
    overflow: "hidden",
    display: "block",
  }));

  // Using the new logo for both light and dark modes
  return (
    <LinkStyled href="/">
      <Image
        src="/newlogo.png"
        alt="logo"
        height={customizer.TopbarHeight}
        width={174}
        priority
        style={{ objectFit: 'contain' }}
      />
    </LinkStyled>
  );
};

export default Logo;
