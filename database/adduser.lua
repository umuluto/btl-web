if redis.call('hexists', 'auth:username', ARGV[1]) == 1 then
	return false
end
local id = redis.call('incr', 'users:count')
redis.call('hset', 'users:'..id, 'username', ARGV[1], 'auth', ARGV[2])
redis.call('hset', 'auth:username', ARGV[1], id)
return id
