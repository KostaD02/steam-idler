import { Response } from 'express';

import { AuthService } from './auth.service';

const setup = () => {
  const authTokenService = {
    signUp: jest.fn().mockReturnValue('signUp'),
    signIn: jest.fn().mockReturnValue('signIn'),
    signOut: jest.fn().mockReturnValue('signOut'),
    refreshToken: jest.fn().mockReturnValue('refreshToken'),
  };
  const authAccountService = {
    getSerializedUser: jest.fn().mockReturnValue('serialized'),
    deleteUser: jest.fn().mockReturnValue('deleteUser'),
    changePassword: jest.fn().mockReturnValue('changePassword'),
    updateUser: jest.fn().mockReturnValue('updateUser'),
    updateSettings: jest.fn().mockReturnValue('updateSettings'),
  };
  const service = new AuthService(
    authTokenService as never,
    authAccountService as never,
  );

  return { service, authTokenService, authAccountService };
};

const user = { _id: 'user-id' } as never;
const response = {} as Response;

describe('AuthService', () => {
  it('delegates getSerializedUser to the account service', () => {
    const { service, authAccountService } = setup();

    expect(service.getSerializedUser(user)).toBe('serialized');
    expect(authAccountService.getSerializedUser).toHaveBeenCalledWith(user);
  });

  it('delegates signUp to the token service', () => {
    const { service, authTokenService } = setup();
    const dto = { email: 'a@b.com' } as never;

    expect(service.signUp(dto, response)).toBe('signUp');
    expect(authTokenService.signUp).toHaveBeenCalledWith(dto, response);
  });

  it('delegates signIn to the token service', () => {
    const { service, authTokenService } = setup();

    expect(service.signIn(user, response)).toBe('signIn');
    expect(authTokenService.signIn).toHaveBeenCalledWith(user, response);
  });

  it('delegates signOut to the token service', () => {
    const { service, authTokenService } = setup();

    expect(service.signOut(response)).toBe('signOut');
    expect(authTokenService.signOut).toHaveBeenCalledWith(response);
  });

  it('delegates refreshToken to the token service', () => {
    const { service, authTokenService } = setup();
    const request = {} as Request;

    expect(service.refreshToken(request, response)).toBe('refreshToken');
    expect(authTokenService.refreshToken).toHaveBeenCalledWith(
      request,
      response,
    );
  });

  it('delegates deleteUser to the account service', () => {
    const { service, authAccountService } = setup();

    expect(service.deleteUser(user, response)).toBe('deleteUser');
    expect(authAccountService.deleteUser).toHaveBeenCalledWith(user, response);
  });

  it('delegates changePassword to the account service', () => {
    const { service, authAccountService } = setup();
    const dto = { oldPassword: 'a', newPassword: 'b' } as never;

    expect(service.changePassword(user, dto, response)).toBe('changePassword');
    expect(authAccountService.changePassword).toHaveBeenCalledWith(
      user,
      dto,
      response,
    );
  });

  it('delegates updateUser to the account service', () => {
    const { service, authAccountService } = setup();
    const dto = { displayName: 'name' } as never;

    expect(service.updateUser(user, dto)).toBe('updateUser');
    expect(authAccountService.updateUser).toHaveBeenCalledWith(user, dto);
  });

  it('delegates updateSettings to the account service', () => {
    const { service, authAccountService } = setup();
    const dto = { showProfileName: true } as never;

    expect(service.updateSettings(user, dto)).toBe('updateSettings');
    expect(authAccountService.updateSettings).toHaveBeenCalledWith(user, dto);
  });
});
