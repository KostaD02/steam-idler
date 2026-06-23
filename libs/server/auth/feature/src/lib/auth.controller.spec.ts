import { Response } from 'express';

import { AuthController } from './auth.controller';

const setup = () => {
  const authService = {
    getSerializedUser: jest.fn().mockReturnValue('serialized'),
    updateUser: jest.fn().mockReturnValue('updateUser'),
    updateSettings: jest.fn().mockReturnValue('updateSettings'),
    deleteUser: jest.fn().mockReturnValue('deleteUser'),
    signUp: jest.fn().mockReturnValue('signUp'),
    signIn: jest.fn().mockReturnValue('signIn'),
    signOut: jest.fn().mockReturnValue('signOut'),
    refreshToken: jest.fn().mockReturnValue('refreshToken'),
    changePassword: jest.fn().mockReturnValue('changePassword'),
  };
  const controller = new AuthController(authService as never);

  return { controller, authService };
};

const user = { _id: 'user-id' } as never;
const response = {} as Response;

describe('AuthController', () => {
  it('returns the serialized current user', () => {
    const { controller, authService } = setup();

    expect(controller.getCurrentUser(user)).toBe('serialized');
    expect(authService.getSerializedUser).toHaveBeenCalledWith(user);
  });

  it('forwards user updates to the service', () => {
    const { controller, authService } = setup();
    const dto = { displayName: 'name' } as never;

    expect(controller.updateUser(user, dto)).toBe('updateUser');
    expect(authService.updateUser).toHaveBeenCalledWith(user, dto);
  });

  it('forwards settings updates to the service', () => {
    const { controller, authService } = setup();
    const dto = { showProfileName: true } as never;

    expect(controller.updateSettings(user, dto)).toBe('updateSettings');
    expect(authService.updateSettings).toHaveBeenCalledWith(user, dto);
  });

  it('forwards user deletion with the response', () => {
    const { controller, authService } = setup();

    expect(controller.deleteUser(user, response)).toBe('deleteUser');
    expect(authService.deleteUser).toHaveBeenCalledWith(user, response);
  });

  it('forwards sign up with the response', () => {
    const { controller, authService } = setup();
    const dto = { email: 'a@b.com' } as never;

    expect(controller.signUp(dto, response)).toBe('signUp');
    expect(authService.signUp).toHaveBeenCalledWith(dto, response);
  });

  it('signs in the user resolved by the local guard', () => {
    const { controller, authService } = setup();
    const dto = { email: 'a@b.com', password: 'secret' } as never;

    expect(controller.signIn(user, response, dto)).toBe('signIn');
    expect(authService.signIn).toHaveBeenCalledWith(user, response);
  });

  it('forwards sign out with the response', () => {
    const { controller, authService } = setup();

    expect(controller.signOut(response)).toBe('signOut');
    expect(authService.signOut).toHaveBeenCalledWith(response);
  });

  it('forwards token refresh with the request and response', () => {
    const { controller, authService } = setup();
    const request = {} as Request;

    expect(controller.refreshToken(request, response)).toBe('refreshToken');
    expect(authService.refreshToken).toHaveBeenCalledWith(request, response);
  });

  it('forwards password changes with the response', () => {
    const { controller, authService } = setup();
    const dto = { oldPassword: 'a', newPassword: 'b' } as never;

    expect(controller.changePassword(user, dto, response)).toBe(
      'changePassword',
    );
    expect(authService.changePassword).toHaveBeenCalledWith(
      user,
      dto,
      response,
    );
  });
});
