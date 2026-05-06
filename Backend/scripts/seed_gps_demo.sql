INSERT INTO fichas (id, "userId", date, "startTime", "endTime", "hoursWorked", status, metadata) 
VALUES (gen_random_uuid(), '97fc806a-5f28-4aa7-a918-da003754c28b', CURRENT_DATE, '09:00', '18:00', 8.0, 'confirmed', '{"location": "40.4168,-3.7038", "address": "Puerta del Sol, Madrid"}');

INSERT INTO fichas (id, "userId", date, "startTime", "endTime", "hoursWorked", status, metadata) 
VALUES (gen_random_uuid(), '97fc806a-5f28-4aa7-a918-da003754c28b', CURRENT_DATE, '10:00', '19:00', 8.0, 'confirmed', '{"location": "41.3851,2.1734", "address": "Plaza Cataluña, Barcelona"}');
