import Fastify, {FastifyInstance, FastifyRequest} from "fastify";
import FastifyRateLimit from "@fastify/rate-limit";

import {GetObjectCommand, ListBucketsCommand, S3Client} from "@aws-sdk/client-s3";

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
        this.fastify.get('/', async (request, reply) => {
            reply.header('Content-Type', 'text/html; charset=utf-8').send(`
                <h1>Marcin Kondrat</h1>
                <p>Hi, I'm Marcin. I'm a software developer from Poland.</p>
                <p>I'm currently working on my <a href="https://assistantscenter.com" target="_blank">Assistants Center</a> project.</p>
                <p>You can find my GitHub <a href="https://github.com/breftejk">here</a></p>
                
                <hr/>
                
                <h2>Projects</h2>
                <ul>
                    <li>
                        
                        <p>Personal website</p>
                        <p>
                            <code>You're here :)</code>
                        </p>
                    </li>
                    <li>
                        <p>Assistants Center</p>
                        <p>
                            <a href="https://github.com/Assistants-Center" target="_blank">GitHub</a>
                        </p>
                    </li>
                    
                    <li>
                        <p>Discord Dashboard</p>
                        <p>
                            <a href="https://github.com/Discord-Dashboard" target="_blank">GitHub</a>
                        </p>
                    </li>
                </ul>
                
                <hr/>
                
                <h2>API</h2>
                <ul>
                        <li>
                            <p>GET S3 Buckets</p>
                            <p>
                                <code>/s3</code>
                            </p>
                        </li>
                        <li>
                            <p>GET S3 Object</p>
                            <p>
                                <code>/s3/:bucket/:key</code>
                            </p>
                        </li>
                </ul>
                
                <hr/>
            
               
                <p><i>Copyright &copy; 2023 Marcin Kondrat. All rights reserved.</i></p>
                <br/>
                <p><i><s>shut up, this website isn't ugly, i just love css so much i didn't use it here <3</s></i></p>
`);
        });

        this.fastify.get('/s3', async (request, reply) => {
            const buckets = await this.s3.send(new ListBucketsCommand({}));
            return buckets.Buckets;
        });

        this.fastify.get('/s3/:bucket/*', async (request: FastifyRequest<{
            Params: {
                bucket: string;
                '*': string;
            },
        }>, reply) => {
            const {bucket, '*': key} = request.params;
            if (!key) return reply.code(400).send({error: 'Missing resource key'});
            const {Body} = await this.s3.send(new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }));
            if (!Body) return reply.code(404).send({error: 'Resource not found'});
            const arr = Body.transformToWebStream();
            reply.send(arr);
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