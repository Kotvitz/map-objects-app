import { AppShell } from "@mantine/core";
import type { ReactNode } from "react";

type Props = {
  sidebar: ReactNode;
  map: ReactNode;
};

export function Layout({ sidebar, map }: Props) {
  return (
    <AppShell
      navbar={{
        width: 320,
        breakpoint: "sm",
      }}
      padding={0}
    >
      <AppShell.Navbar p="md">
        {sidebar}
      </AppShell.Navbar>

      <AppShell.Main>
        {map}
      </AppShell.Main>
    </AppShell>
  );
}