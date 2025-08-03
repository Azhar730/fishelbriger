
export type IFile = {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    destination: string
    filename: string
    path: string
    size: number
}

export type ICloudinary = {
    asset_id: string;
    public_id: string;
    version: number,
    version_id: string;
    signature: string;
    width: number,
    height: number,
    format: string;
    resource_type: string;
    created_at: string;
    tags: any[],
    bytes: number,
    type: string;
    etag: string;
    placeholder: false,
    url: string;
    secure_url: string;
    folder: string;
    access_mode: string;
    overwritten: true,
    original_filename: string;
    api_key: string;
}

export interface IDigitalOcean {
    location: string | null;
}