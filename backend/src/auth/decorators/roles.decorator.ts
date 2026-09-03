import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../../../constants/constants';
import { Role } from '../../generated/prisma/client';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
