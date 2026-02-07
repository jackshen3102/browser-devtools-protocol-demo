/**
 * CDP 响应类型定义
 * 定义常用的 CDP 命令响应类型
 */

/**
 * Browser Domain 类型
 */
export interface BrowserVersion {
  product: string;
  'Browser': string;
  'Browser-Version': string;
  'WebKit-Version': string;
  'User-Agent': string;
}

/**
 * Page Domain 类型
 */
export interface PageNavigateResponse {
  frameId: string;
  loaderId: string;
  errorText?: string;
}

export interface FrameTree {
  frame: Frame;
  childFrames?: FrameTree[];
}

export interface Frame {
  id: string;
  parentId?: string;
  loaderId: string;
  name?: string;
  url: string;
  securityOrigin: string;
  mimeType: string;
  unreachableUrl?: string;
}

export interface LayoutMetrics {
  layoutViewport: Viewport;
  visualViewport: Viewport;
  contentSize: Size;
}

export interface Viewport {
  clientX: number;
  clientY: number;
  scale: number;
  scrollX: number;
  scrollY: number;
  clientWidth: number;
  clientHeight: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ScreenshotResponse {
  data: string; // Base64 编码的图片数据
}

export interface PDFResponse {
  data: string; // Base64 编码的 PDF 数据
}

/**
 * DOM Domain 类型
 */
export interface Node {
  nodeId: number;
  parentId?: number;
  backendNodeId: number;
  nodeType: number;
  nodeName: string;
  localName?: string;
  nodeValue?: string;
  childNodeCount?: number;
  children?: Node[];
  attributes?: string[];
}

export interface Document {
  root: Node;
}

export interface BoxModel {
  model: BoxModelContent;
  content: number[];
  padding: number[];
  border: number[];
  margin: number[];
  width: number;
  height: number;
  shapeOutside?: any;
}

export interface BoxModelContent {
  content: number[];
  padding: number[];
  border: number[];
  margin: number[];
  width: number;
  height: number;
}

/**
 * Network Domain 类型
 */
export interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  hasPostData?: boolean;
  mixedContentType?: string;
  initialPriority: string;
  referrerPolicy: string;
  isLinkPreload?: boolean;
  isSameSite?: boolean;
}

export interface Response {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  mimeType: string;
  requestHeaders?: Record<string, string>;
  connectionReused: boolean;
  connectionId: number;
  remoteIPAddress?: string;
  remotePort?: number;
  fromDiskCache?: boolean;
  fromServiceWorker?: boolean;
  encodedDataLength?: number;
  securityState?: string;
  securityDetails?: any;
}

export interface ResponseBody {
  body: string;
  base64Encoded: boolean;
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  size?: number;
  httpOnly?: boolean;
  secure?: boolean;
  session?: boolean;
  sameSite?: string;
  priority?: string;
}

/**
 * Runtime Domain 类型
 */
export interface RemoteObject {
  type: string;
  subtype?: string;
  className?: string;
  value?: any;
  unserializableValue?: string;
  description?: string;
  objectId?: string;
  preview?: any;
}

export interface EvaluateResponse {
  result: RemoteObject;
  exceptionDetails?: ExceptionDetails;
}

export interface ExceptionDetails {
  exceptionId: number;
  text: string;
  lineNumber: number;
  columnNumber: number;
  url?: string;
  stackTrace?: any;
  exception?: RemoteObject;
  executionContextId?: number;
}

export interface PropertyDescriptor {
  name: string;
  value?: RemoteObject;
  writable?: boolean;
  get?: RemoteObject;
  set?: RemoteObject;
  configurable?: boolean;
  enumerable?: boolean;
  wasThrown?: boolean;
  isOwn?: boolean;
  symbol?: RemoteObject;
}

export interface GetPropertiesResponse {
  result: PropertyDescriptor[];
  internalProperties?: PropertyDescriptor[];
  privateProperties?: PropertyDescriptor[];
  exceptionDetails?: ExceptionDetails;
}

/**
 * Target Domain 类型
 */
export interface TargetInfo {
  targetId: string;
  type: string;
  title: string;
  url: string;
  attached: boolean;
  canAccessOpener: boolean;
  browserContextId?: string;
}

export interface CreateTargetResponse {
  targetId: string;
}

/**
 * Emulation Domain 类型
 */
export interface DeviceMetrics {
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile?: boolean;
  fitWindow?: boolean;
  scale?: number;
  screenWidth?: number;
  screenHeight?: number;
  positionX?: number;
  positionY?: number;
  dontSetVisibleSize?: boolean;
  screenOrientation?: ScreenOrientation;
}

export interface ScreenOrientation {
  type: string;
  angle: number;
}

/**
 * Performance Domain 类型
 */
export interface Metric {
  name: string;
  value: number;
}

export interface GetMetricsResponse {
  metrics: Metric[];
  title: string;
}

/**
 * Storage Domain 类型
 */
export interface GetCookiesResponse {
  cookies: Cookie[];
}

export interface DOMStorageItem {
  name: string;
  value: string;
}

export interface GetDOMStorageItemsResponse {
  entries: Array<[string, string]>;
}

/**
 * Debugger Domain 类型
 */
export interface Location {
  scriptId: string;
  lineNumber: number;
  columnNumber?: number;
}

export interface Breakpoint {
  breakpointId: string;
  locations: Location[];
}

export interface SetBreakpointByUrlResponse {
  breakpointId: string;
  locations: Location[];
}

export interface CallFrame {
  callFrameId: string;
  functionName: string;
  location: Location;
  url: string;
  scopeChain: any[];
  this?: RemoteObject;
  returnValue?: RemoteObject;
}

export interface PausedResponse {
  callFrames: CallFrame[];
  reason: string;
  data?: any;
  hitBreakpoints?: string[];
  asyncStackTrace?: any;
  asyncStackTraceId?: any;
  topCallFrameScopes?: any[];
}
