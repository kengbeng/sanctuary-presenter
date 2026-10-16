export interface Display {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary: boolean;
}
export interface OutputDisplayAdapter {
  discover(): Promise<Display[]>;
  open(url: string, display?: Display): Window | null;
}
export class ManualDisplayAdapter implements OutputDisplayAdapter {
  async discover(): Promise<Display[]> {
    return [];
  }
  open(url: string) {
    return window.open(url, "_blank", "popup,width=960,height=540");
  }
}
export class ChromiumDisplayAdapter extends ManualDisplayAdapter {
  async discover() {
    const w = window as unknown as {
      getScreenDetails?: () => Promise<{
        screens: Display[];
        addEventListener: (type: string, cb: () => void) => void;
      }>;
    };
    if (!w.getScreenDetails)
      throw Error(
        "Automatic placement unavailable. Use Manual and move the output to the projector.",
      );
    const details = await w.getScreenDetails();
    details.addEventListener?.("screenschange", () =>
      window.dispatchEvent(new Event("sanctuary-display-change")),
    );
    details.addEventListener?.("currentscreenchange", () =>
      window.dispatchEvent(new Event("sanctuary-display-change")),
    );
    return details.screens;
  }
  open(url: string, d?: Display) {
    return d
      ? window.open(
          url,
          "_blank",
          `popup,left=${d.left},top=${d.top},width=${d.width},height=${d.height}`,
        )
      : super.open(url);
  }
}
