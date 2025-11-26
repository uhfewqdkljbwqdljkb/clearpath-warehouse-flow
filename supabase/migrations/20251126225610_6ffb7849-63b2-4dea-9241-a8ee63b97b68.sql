-- Update josephfarah2005@gmail.com to super_admin
DELETE FROM user_roles 
WHERE user_id = '470e28e3-427d-4981-af5f-3675941ab8fb';

INSERT INTO user_roles (user_id, role)
VALUES ('470e28e3-427d-4981-af5f-3675941ab8fb', 'super_admin');