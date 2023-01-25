export const isStringOrBuffer = (obj: any) => {
    return typeof obj === "string" || Buffer.isBuffer(obj);
}