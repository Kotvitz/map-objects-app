import { Flex } from "@mantine/core";

type Props = {
  sidebar: React.ReactNode;
  map: React.ReactNode;
};

export function Layout({ sidebar, map }: Props) {
  return (
    <Flex h="100vh">
      <Flex w={300} p="sm" direction="column">
        {sidebar}
      </Flex>

      <Flex flex={1}>
        {map}
      </Flex>
    </Flex>
  );
}