import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import multer from "multer";
import { ICloudinary, IDigitalOcean, IFile } from "../interfaces/file";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import config from "../config";
import { nanoid } from "nanoid";
import path from "path";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// S3 / DigitalOcean Space Client
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: config.aws.do_space_endpoint,
  credentials: {
    accessKeyId: config.aws.do_space_access_key || "",
    secretAccessKey: config.aws.do_space_secret_key || "",
  },
});

// Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `tmp/`);
  },
  filename: function (req, file, cb) {
    // Ensure unique filename
    const uniqueSuffix = `${nanoid()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage });

// Upload to Cloudinary
const uploadToCloudinary = async (file: IFile): Promise<ICloudinary | null> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file?.path,
      (error: any, result: ICloudinary) => {
        fs.unlinkSync(file?.path); // Clean up temp file

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// Destroy from Cloudinary
const destroyFromCloudinary = async (
  file: string
): Promise<{ result: string } | null> => {
  const decodedUrl = decodeURIComponent(file);
  const publicId = decodedUrl?.split("/")?.pop()?.split(".")[0];

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId!,
      (error: any, result: { result: string }) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// Upload to DigitalOcean Spaces
export const uploadToDigitalOceanAWS = async (
  file: Express.Multer.File
): Promise<IDigitalOcean> => {
  try {
    if (!file?.path || !file?.mimetype || !file?.originalname) {
      throw new Error("Invalid file data provided.");
    }

    const fileStream: Readable = fs.createReadStream(file.path);

    const key = `${nanoid()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: config.aws.do_space_bucket,
      Key: key,
      Body: fileStream,
      ACL: "public-read",
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const Location = `${config.aws.do_space_endpoint}/${config.aws.do_space_bucket}/${key}`;

    await fs.promises.unlink(file.path); // Clean up temp file
    console.log(`Uploaded file to:`, Location);

    return { location: Location };
  } catch (error: any) {
    console.error(`Error uploading file: ${file?.path}`, error);

    if (file?.path && fs.existsSync(file.path)) {
      await fs.promises.unlink(file.path).catch(() => {
        console.warn(
          `Failed to delete temp file after upload error: ${file.path}`
        );
      });
    }

    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Delete from DigitalOcean Spaces
const deleteFromDigitalOceanAWS = async (fileUrl: string): Promise<void> => {
  try {
    const key = fileUrl.replace(
      `${config.aws.do_space_endpoint}/${config.aws.do_space_bucket}/`,
      ""
    );

    const command = new DeleteObjectCommand({
      Bucket: config.aws.do_space_bucket,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Successfully deleted file: ${fileUrl}`);
  } catch (error: any) {
    console.error(`Error deleting file: ${fileUrl}`, error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Exported Helper
export const FileHelper = {
  destroyFromCloudinary,
  uploadToCloudinary,
  uploadToDigitalOceanAWS,
  deleteFromDigitalOceanAWS,
  upload,
};
