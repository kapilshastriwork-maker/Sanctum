ALTER TABLE connected_services 
ADD CONSTRAINT connected_services_user_service_unique 
UNIQUE (user_id, service_name);
