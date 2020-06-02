--r = [-45,45]

local fov = 60
local cameraDistance = 1.25 / math.tan(fov/2 * math.pi / 180) + 1;
local cubedistance = cameraDistance - 1;
   
function getf(r)
  local fov = 45
  local cr = math.cos(r * math.pi / 180) * math.sqrt(2)
  local sr = math.sin(r * math.pi / 180) * math.sqrt(2)
  --print( cr, sr )
  
  local tf = math.tan(fov/2 * math.pi / 180)
  --print( tf) 
  local range1 = tf * (cameraDistance-cr)
  local range2 = tf * cubedistance
  --print( range1, range2 )
  
  return range2 * (sr / range1)
end
print( getf( 0 ) )
print( getf( 22.5 ) )
print( getf( 45 ) )

function findr( y )
   
   local r = 0
   local add = 45
   for i = 0, 1000 do
      local test = getf(r)
      if test < y then
         r = r + add
      elseif test > y then
         r = r - add
      else
         return r
      end
      
      if r < 0 then r = 0 end
      if r > 45 then r = 45 end
      add = add * 0.5
   end
   return r
end

print( "TEST", findr( 0 ))

local results = {}

for i = 0, 128 do
   results[i+1] = 45 - findr( 1 - (i / 128) )
end
results[#results+1] = 45

print( results )

print( "const m_turnTable = [" )
print( table.concat( results, "," ) )
print( "];" )

--[[
function getr(f)
  local tf = math.tan(fov/2 * math.pi / 180)
  local range2 = tf * 3
  f/(tf*3) = sr / (tf * (4-cr))
   
  local fov = 45
  local cr = math.cos(r * math.pi / 180) * math.sqrt(2)
  local sr = math.sin(r * math.pi / 180) * math.sqrt(2)
  print( cr, sr )
  
  print( tf) 
  local range1 = tf * (4-cr)
  print( range1, range2 )
  
  return range2 * (sr / range1)
   
end]]