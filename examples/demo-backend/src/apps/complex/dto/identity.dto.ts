import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum ComplexRole {
  Admin = "admin",
  Manager = "manager",
  Support = "support",
  Viewer = "viewer",
}

export class ComplexLoginDto {
  @ApiProperty({ format: "email", example: "admin@complex.demo" })
  @IsEmail()
  email!: string;

  @ApiProperty({ format: "password", example: "demo1234", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class ComplexUserDto {
  @ApiProperty({ example: "complex-user-admin" })
  id!: string;

  @ApiProperty({ format: "email", example: "admin@complex.demo" })
  email!: string;

  @ApiProperty({ example: "Complex Admin" })
  name!: string;

  @ApiProperty({ enum: ComplexRole })
  role!: ComplexRole;

  @ApiProperty({ nullable: true, example: "https://i.pravatar.cc/160?img=20" })
  avatarUrl!: string | null;

  @ApiProperty({ type: [String], example: ["org-acme", "org-globex"] })
  organizationIds!: string[];
}

export class ComplexUserResponseDto {
  @ApiProperty({ type: ComplexUserDto })
  data!: ComplexUserDto;
}

export class ComplexUsersResponseDto {
  @ApiProperty({ type: [ComplexUserDto] })
  data!: ComplexUserDto[];
}

export class CookieSessionDataDto {
  @ApiProperty({ type: ComplexUserDto })
  user!: ComplexUserDto;

  @ApiProperty({
    example: "5f2642ca-2ba4-4ee3-bf2e-d5d37a97686c",
    description: "Send this value in X-CSRF-Token for authenticated mutations.",
  })
  csrfToken!: string;

  @ApiProperty({ format: "date-time" })
  expiresAt!: string;
}

export class CookieSessionResponseDto {
  @ApiProperty({ type: CookieSessionDataDto })
  data!: CookieSessionDataDto;
}

export enum OrganizationPlan {
  Starter = "starter",
  Business = "business",
  Enterprise = "enterprise",
}

export class OrganizationDto {
  @ApiProperty({ example: "org-acme" })
  id!: string;

  @ApiProperty({ example: "Acme Commerce" })
  name!: string;

  @ApiProperty({ enum: OrganizationPlan })
  plan!: OrganizationPlan;

  @ApiProperty({ example: "Europe/Berlin" })
  timezone!: string;

  @ApiProperty({ enum: ["USD", "EUR"], example: "USD" })
  currency!: "USD" | "EUR";

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class OrganizationsResponseDto {
  @ApiProperty({ type: [OrganizationDto] })
  data!: OrganizationDto[];
}

export class OrganizationResponseDto {
  @ApiProperty({ type: OrganizationDto })
  data!: OrganizationDto;
}

export class MemberDto {
  @ApiProperty({ example: "member-001" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "complex-user-manager" })
  userId!: string;

  @ApiProperty({ example: "Complex Manager" })
  userName!: string;

  @ApiProperty({ format: "email", example: "manager@complex.demo" })
  email!: string;

  @ApiProperty({ enum: ComplexRole })
  role!: ComplexRole;

  @ApiProperty({ enum: ["active", "invited", "suspended"], example: "active" })
  status!: "active" | "invited" | "suspended";
}

export class MembersResponseDto {
  @ApiProperty({ type: [MemberDto] })
  data!: MemberDto[];
}

export class ChangeComplexRoleDto {
  @ApiProperty({ enum: ComplexRole, example: ComplexRole.Viewer })
  @IsEnum(ComplexRole)
  role!: ComplexRole;
}
