import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.headers['x-tenant-id'] as string;

        if (!tenantId) {
            throw new UnauthorizedException('x-tenant-id header is missing');
        }

        tenantContext.run({ tenantId }, () => next());
    }
}
