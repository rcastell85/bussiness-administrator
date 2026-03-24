import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async signup(data: any) {
        const { email, password, tenantId, role } = data;

        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const tenant = await this.prisma.tenant.upsert({
            where: { id: tenantId },
            update: {},
            create: { id: tenantId, name: tenantId },
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        return this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                tenantId,
                role: role || 'seller',
            },
            select: {
                id: true,
                email: true,
                role: true,
                tenantId: true,
            },
        });
    }

    async login(email: string, pass: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            },
        };
    }
}
