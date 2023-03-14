import Fastify, {FastifyInstance, FastifyRequest} from "fastify";
import FastifyRateLimit from "@fastify/rate-limit";

import {S3Client, ListBucketsCommand, GetObjectCommand} from "@aws-sdk/client-s3";

import Environment from "../environment";

export class Server {
    public readonly fastify: FastifyInstance;
    public readonly s3: S3Client = new S3Client({
        credentials: {
            accessKeyId: Environment.awsAccessKeyId,
            secretAccessKey: Environment.awsSecretAccessKey,
        },
        region: 'eu-west-3',
    });

    constructor() {
        console.log("Initializing server...");
        this.fastify = Fastify();
    }

    public async middlewares(): Promise<void> {
        await this.fastify.register(FastifyRateLimit, {
            global: true,
            max: 100,
            timeWindow: '1 hour'
        });
    }

    public async routes(): Promise<void> {
        this.fastify.get('/s3', async (request, reply) => {
            const buckets = await this.s3.send(new ListBucketsCommand({}));
            return buckets.Buckets;
        });

        this.fastify.get('/s3/:bucket/:key', async (request: FastifyRequest<{
            Params: {
                bucket: string;
                key: string;
            }
        }>, reply) => {
            const {bucket, key} = request.params;
            const object = await this.s3.send(new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }));
            reply.header('Content-Type', object.ContentType).send(object.Body);
        });
    }

    public async start(): Promise<void> {
        await this.middlewares();
        await this.routes();

        await this.fastify.listen({
            port: Environment.port
        });
    }
}