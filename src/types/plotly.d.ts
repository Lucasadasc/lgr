declare module "plotly.js-basic-dist-min" {
  import type { Config, Data, Layout, PlotlyHTMLElement } from "plotly.js";

  const Plotly: {
    react(
      root: HTMLElement,
      data: Data[],
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ): Promise<PlotlyHTMLElement>;
    newPlot(
      root: HTMLElement,
      data: Data[],
      layout?: Partial<Layout>,
      config?: Partial<Config>,
    ): Promise<PlotlyHTMLElement>;
    purge(root: HTMLElement): void;
  };
  export default Plotly;
}
