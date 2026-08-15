/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [

      'origins-hms.s3.ap-south-1.amazonaws.com'
      ,
      'origins-hms.s3.amazonaws.com'
    ]
  }
};

export default nextConfig;
