export const loginModalHTML = `
    <head>
        <style>
            .modal-backdrop.show {
                z-index: 99990 !important;
            }

            .modal {
                z-index: 99999 !important;
            }

            .modal.fade .modal-dialog {
                transform: scale(0);
                transition: all 0.25s ease-out;
            }

            .modal.show .modal-dialog {
                transform: scale(1);
            }

            .modal-content {
                border-radius: 15px;
            }
        </style>
    </head>
    <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true"
        data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow p-3">
                <div class="modal-header border-0 justify-content-center">
                    <h4 class="modal-title fw-bold" id="loginModalLabel">Đăng nhập Admin</h4>
                </div>

                <div class="modal-body">
                    <form id="login-form">
                        <div class="row gy-3 overflow-hidden">
                            <div class="col-12">
                                <div class="form-floating mb-3 border border-radius-lg">
                                    <input type="text" class="form-control px-3" name="username" id="username"
                                        placeholder="Username" required="">
                                    <label for="username" class="form-label px-3 m-0 fs-6">Tên đăng nhập</label>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="form-floating mb-3 border border-radius-lg">
                                    <input type="password" class="form-control px-3" name="password" id="password"
                                        placeholder="Password" required="">
                                    <label for="password" class="form-label px-3 m-0 fs-6">Mật khẩu</label>
                                </div>
                            </div>
                            <!-- <div class="col-12">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="" name="remember_me"
                                            id="remember_me">
                                        <label class="form-check-label text-secondary" for="remember_me">
                                            Keep me logged in
                                        </label>
                                    </div>
                                </div> -->
                            <div class="d-flex justify-content-center">
                                <div class="d-grid">
                                    <button class="btn btn-dark btn-lg fs-6 px-6" type="submit">Đăng nhập</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="modal-footer border-0 justify-content-center pt-0">
                    <small class="text-muted">Hệ thống quản trị Dashboard</small>
                </div>
            </div>
        </div>
    </div>
`;
