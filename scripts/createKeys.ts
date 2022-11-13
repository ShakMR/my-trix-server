import crypto from "crypto";
import fs from "fs";
import path from "path";
import yargs, { Argv, Options } from "yargs";
import { hideBin } from "yargs/helpers";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  // The standard secure default length for RSA keys is 2048 bits
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

const options: Record<string, Options> = {
  toFile: {
    alias: "f",
    description: "Writes key pair into files",
    type: "boolean",
    default: false,
  },
};

interface Arguments {
  [x: string]: unknown;

  _: string[];
  toFile: boolean;
  f: boolean;
}

const args = yargs(hideBin(process.argv))
  .options(options)
  .help()
  .alias("help", "h")
  .parseSync() as unknown as Arguments;

if (args.f || args.toFile) {
  fs.writeFile("private.pem", privateKey, { encoding: "utf-8" }, () => {
      console.log("Private key writen to", path.join(path.resolve(process.cwd()), "private.pem"))
  });
  fs.writeFile("public.pem", publicKey, { encoding: "utf-8" }, () => {
      console.log("Public key writen to", path.join(path.resolve(process.cwd()), "public.pem"))
  });
} else {
  console.log(privateKey);
  console.log(publicKey);
}
