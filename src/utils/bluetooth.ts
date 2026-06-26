export interface ScannedDevice {
  id: string;
  name: string;
}

type WebBluetoothDevice = {
  id: string;
  name: string | null;
  gatt?: {
    connected: boolean;
    connect(): Promise<unknown>;
    disconnect(): void;
  };
  addEventListener(type: string, listener: () => void): void;
};

type WebBluetooth = {
  getAvailability(): Promise<boolean>;
  requestDevice(options?: unknown): Promise<WebBluetoothDevice>;
};

function getNavigatorBluetooth(): WebBluetooth | null {
  const nav = navigator as Navigator & { bluetooth?: WebBluetooth };
  return nav.bluetooth || null;
}

export class BluetoothScanner {
  private device: WebBluetoothDevice | null = null;
  private onDetectedCallback: ((device: ScannedDevice) => void) | null = null;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  static isSupported(): boolean {
    return !!getNavigatorBluetooth() && typeof getNavigatorBluetooth()!.requestDevice === 'function';
  }

  static async getAvailability(): Promise<boolean> {
    try {
      const bt = getNavigatorBluetooth();
      if (!bt) return false;
      return await bt.getAvailability();
    } catch {
      return false;
    }
  }

  async startScan(
    onDeviceFound: (device: ScannedDevice) => void,
    options?: { services?: string[]; namePrefix?: string; timeoutMs?: number }
  ): Promise<void> {
    const bt = getNavigatorBluetooth();
    if (!bt) {
      throw new Error('您的浏览器不支持Web Bluetooth API，请使用Chrome或Edge浏览器，并在HTTPS或localhost环境下访问');
    }

    const available = await BluetoothScanner.getAvailability();
    if (!available) {
      throw new Error('蓝牙不可用，请确保您的设备已开启蓝牙');
    }

    this.onDetectedCallback = onDeviceFound;

    try {
      const requestOptions: Record<string, unknown> = {
        acceptAllDevices: !options?.services && !options?.namePrefix,
        optionalServices: options?.services || [],
      };
      if (options?.namePrefix) {
        requestOptions.filters = [{ namePrefix: options.namePrefix }];
        requestOptions.acceptAllDevices = false;
      }

      this.device = await bt.requestDevice(requestOptions);

      const deviceInfo: ScannedDevice = {
        id: this.device.id,
        name: this.device.name || '未知设备',
      };

      if (this.onDetectedCallback) {
        this.onDetectedCallback(deviceInfo);
      }

      if (this.device.gatt) {
        this.device.addEventListener('gattserverdisconnected', () => {});
      }

      if (options?.timeoutMs) {
        this.scanTimeout = setTimeout(() => {
          this.stopScan();
        }, options.timeoutMs);
      }
    } catch (err) {
      if ((err as Error).name === 'NotFoundError') {
        return;
      }
      throw err;
    }
  }

  stopScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.device = null;
    this.onDetectedCallback = null;
  }

  async connectToGATT(): Promise<boolean> {
    if (!this.device?.gatt) {
      return false;
    }
    try {
      await this.device.gatt.connect();
      return true;
    } catch {
      return false;
    }
  }

  destroy(): void {
    this.stopScan();
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }
}

export function simulateProximityDetection(
  onDetected: () => void,
  onLost: () => void,
  enabled: boolean = true
): () => void {
  if (!enabled) {
    return () => {};
  }

  const checkInterval = setInterval(() => {
    if (Math.random() < 0.03) {
      onDetected();
      setTimeout(() => {
        if (Math.random() < 0.7) {
          onLost();
        }
      }, 8000 + Math.random() * 12000);
    }
  }, 10000);

  return () => clearInterval(checkInterval);
}
