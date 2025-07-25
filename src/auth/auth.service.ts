import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Role } from '../shared/constants/roles.enum';
import { UnauthorizedException } from '../shared/exceptions/unauthorized.exception';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password' | 'emailToLowerCase'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, emailToLowerCase, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: Role.USER,
    });

    return this.generateToken(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user);
  }

  async registerAdmin(registerDto: RegisterDto, secretKey: string): Promise<AuthResponseDto> {
    if (secretKey !== this.configService.get<string>('ADMIN_SECRET_KEY')) {
      throw new UnauthorizedException('Invalid secret key');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: Role.ADMIN,
    });

    return this.generateToken(user);
  }

  private generateToken(user: Omit<User, 'password' | 'emailToLowerCase'>): AuthResponseDto {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    return {
      token: this.jwtService.sign(payload),
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    };
  }
}