// server/src/types/multer.d.ts
// Extends the Express Request interface with multer file properties.
// @types/multer normally handles this via express-serve-static-core augmentation,
// but we provide an explicit ambient shim for ts-node ESM resolution consistency.

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string
      originalname: string
      encoding: string
      mimetype: string
      size: number
      destination: string
      filename: string
      path: string
      buffer: Buffer
    }
  }
  interface Request {
    file?: Multer.File
    files?: { [fieldname: string]: Multer.File[] } | Multer.File[]
  }
}
