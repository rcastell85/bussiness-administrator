import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    async signup(@Body() signupDto: any) {
        return this.authService.signup(signupDto);
    }

    @Post('login')
    async login(@Body() loginDto: any) {
        return this.authService.login(loginDto.email, loginDto.password);
    }
}
