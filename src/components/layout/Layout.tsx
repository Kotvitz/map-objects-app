type Props = {
  sidebar: React.ReactNode;
  map: React.ReactNode;
};

export function Layout({ sidebar, map }: Props) {
  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: 320,
          borderRight: "1px solid #ddd",
          padding: 16,
          overflowY: "auto",
          background: "#fff",
        }}
      >
        {sidebar}
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          position: "relative",
        }}
      >
        {map}
      </main>
    </div>
  );
}