export const siteConfig = {
  name: "Mariachis el rey",
  description: "Somos mariachis queremos llevar la agenda de citas de clientes, queremos que los clientes vean los planes que tenemos y coordinar fechas y disponibilidad de los empleados",
  archetype: "storefront" as
    | "storefront"
    | "dashboard"
    | "workflow"
    | "saas_tool"
    | "content",
  primaryColor: "#0f766e",
} as const;
