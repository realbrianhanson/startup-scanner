-- Fix stuck reports: mark action_plan as "skipped" and update generation_status
UPDATE reports 
SET generation_status = jsonb_set(generation_status, '{action_plan}', '"skipped"')
WHERE id IN ('bd59d631-6340-435a-b7a5-85509694d06c', '7ae218c8-68f9-4d01-9327-d078a17331b8');

-- Fix stuck projects: mark as complete
UPDATE projects 
SET status = 'complete', validation_score = COALESCE(validation_score, 55)
WHERE id IN ('a36cbfdb-7b1a-4824-b8df-d603e5326dba', '56e8f552-c482-4b35-89c1-1fbc49ad6514')
AND status = 'analyzing';
