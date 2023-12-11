import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export async function downloadFromS3(file_key: string) {
  try {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_SECRET,
    });

    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      },
      region: "ap-south-1",
    });

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
    };

    const obj = await s3.getObject(params).promise();

    // Specify the full path including the directory
    const directory = path.join(__dirname, "downloads"); // Adjust the path accordingly
    const file_name = path.join(directory, `${Date.now()}.pdf`);

    // Check if the directory exists, if not, create it
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(file_name, obj.Body as Buffer);
    return file_name;
  } catch (error) {
    console.error(error);
    return null;
  }
}
