-- Star Spar SQL file
-- starspar

SELECT * FROM starsparLocations 
where mapname = 'noob' AND ticksremaining > 0

delete from starsparLocations where objectname = 'Player3'

--DROP FUNCTION resetDemon(a integer, b integer, c text)
CREATE FUNCTION resetDemon(a integer, b integer, c text) RETURNS void AS $$
DECLARE
  x int[];
BEGIN
UPDATE starsparLocations 
SET locx = a, locy= b 
WHERE objectName = 'demon';

UPDATE starsparLocations 
SET score = (SELECT score from starsparLocations WHERE objectName = c)+1 
WHERE objectName = c;

END;
$$ LANGUAGE plpgsql;

SELECT resetDemon(2,4,'Gilgamech');



--DROP FUNCTION insertProjectile(objName text, mapNm text, locX numeric, locY numeric, ammo numeric, score numeric);
CREATE FUNCTION insertProjectile(objName text, mapNm text, locX numeric, locY numeric, ammo1 numeric, score1 numeric) RETURNS void AS $$
DECLARE
  x int[];
BEGIN

IF (SELECT ammo FROM starsparLocations WHERE objectName = objName) > 0
THEN
	INSERT INTO starsparLocations (objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType)
	VALUES ('projectile',mapNm,locX,locY,100,ammo1,score1,100,objName,0,'projectile');

	UPDATE starsparLocations
	SET ammo=ammo-1
	WHERE objectName=objName;

END IF;
END;
$$ LANGUAGE plpgsql;

SELECT insertProjectile('Gilgamech','noob',2,4,200,400);

UPDATE starsparLocations
SET ammo=100
WHERE objectName='Gilgamech' 






--DROP FUNCTION updatePlayer(objName text, mapNm text, locyX numeric, locyY numeric, updateloc int);
CREATE FUNCTION updatePlayer(objName text, mapNm text, locyX numeric, locyY numeric, updateloc int) RETURNS void
AS $$
DECLARE
    var_r record;
BEGIN
UPDATE starsparLocations 
SET locx = (SELECT random() * 10000 + 1), locy=(SELECT random() * 10000 + 1),hp = 100,score=0,ticksremaining=100,updatelocation=1
WHERE objectName=objName AND hp <= 0;

INSERT INTO starsparLocations (objectName, mapName, locX, locY, hp, ammo, score, ticksremaining,objectOwner,updateLocation,objectType) 
SELECT objName, mapNm,(SELECT random() * 10000 + 1),(SELECT random() * 10000 + 1),100,100,0,100,objName,1,'player'
WHERE NOT EXISTS (SELECT id FROM starsparLocations WHERE objectName = objName);

UPDATE starsparLocations
SET locx=locyX, locy=locyY,ticksremaining=100,updatelocation=updateloc
WHERE objectName=objName
	AND locX <= locyX +32
	AND locyX <= locX +32
	AND locy <= locyY +32
	AND locyY <= locy +32;

END;
$$ LANGUAGE plpgsql;

SELECT updatePlayer('Gilgamech','noob',1000,1000,1);



--DROP FUNCTION updatePlayer(objName text, mapNm text, locyX unknown, locyY unknown, updateloc unknown);
CREATE FUNCTION updatePlayer(objName text, mapNm text, locyX text, locyY text, updateloc text) RETURNS void
AS $$
DECLARE
    var_r record;
BEGIN


END;
$$ LANGUAGE plpgsql;

SELECT updatePlayer('Player3','noob','undefined','undefined','undefined');




--DROP FUNCTION gameTick(mapNm text);
CREATE FUNCTION gameTick(mapNm text DEFAULT 'noob') RETURNS void AS $$
DECLARE
	x int[];
	var_r record;
BEGIN
--Delete old projectiles
DELETE FROM starsparLocations
WHERE objectType='projectile' and hp <= 0;

--Age out objects
UPDATE starsparLocations 
SET ticksremaining = ticksremaining - 1
WHERE objectType!='npc' and ticksremaining >= 0;

--Respawn things
UPDATE starsparLocations 
SET locx = (SELECT random() * 10000 + 1), locy=(SELECT random() * 10000 + 1),hp = 100,score=0
WHERE objectType!='projectile' and hp <= 0;

FOR var_r IN(SELECT * FROM starsparLocations where mapname = mapNm) LOOP
--Move projectiles 
UPDATE starsparLocations SET hp = hp-1, locX = case 
	when locX > ammo then locX-3
	when locX < ammo then locX+3
	else locX -- don't change anything
  end,locy = case 
	when locy > score then locy-3
	when locy < score then locy+3
	else locy -- don't change anything
  end
WHERE objectType = 'projectile';

-- If collision with projectile
FOR var_p IN(SELECT * FROM starsparLocations where mapname = mapNm) LOOP
IF var_p.locX <= var_r.locX +32
	AND var_r.locX <= var_p.locX 
	AND var_p.locy <= var_r.locY +32
	AND var_r.locY <= var_p.locy 
	AND var_p.objectName != var_r.objectname
	AND var_p.objectName != var_r.objectowner
	AND var_p.objectType = 'projectile'
THEN
	UPDATE starsparLocations SET hp =hp-1 where objectName
	WHERE 
	
	INSERT INTO starsparLocations (objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType)
	VALUES ('projectile',mapNm,locX,locY,100,ammo1,score1,100,objName,0,'projectile');

	UPDATE starsparLocations
	SET ammo=ammo-1
	WHERE objectName=objName;

END IF;
END IF;

UPDATE starsparLocations SET hp = case 
	when locX <= var_r.locX
	AND var_r.locX <= locX +32
	AND locy <= var_r.locY +32
	AND var_r.locY <= locy +32
	AND objectName != var_r.objectname
	AND objectName != var_r.objectowner
	then hp-1
	else hp -- don't change anything
  end;

	--score = score+1 where objectname = var_r.objectowner

END LOOP;

-- If collision with demon


-- If collision with other player

END;
$$ LANGUAGE plpgsql;

SELECT gameTick();








UPDATE starsparLocations SET hp=100 WHERE objectname = 'projectile';
SELECT * FROM starsparLocations WHERE objectname = 'projectile';

UPDATE starsparLocations SET locx=locx-1 WHERE objectname = 'projectile';
SELECT objectname FROM starsparLocations
--UPDATE starsparLocations SET hp = hp-1
WHERE locx IN (SELECT locx FROM starsparLocations GROUP BY locx HAVING count(*) > 1)
AND locy IN (SELECT locy FROM starsparLocations GROUP BY locy HAVING count(*) > 1)
AND objectname != 'projectile'


SELECT objectname FROM starsparLocations
	--SELECT * FROM starsparLocations
	WHERE locx IN (SELECT locx FROM starsparLocations WHERE objectname = 'projectile') 
	AND locy IN (SELECT locy FROM starsparLocations WHERE objectname = 'projectile') 
	AND objectname != 'projectile'

UPDATE starsparLocations SET locx=100 where objectname = 'Gilgamech';

if (player.x <= (demon.x + 32)
&& demon.x <= (player.x + 32)
&& player.y <= (demon.y + 32)
&& demon.y <= (player.y + 32))

--SELECT objectname FROM starsparLocations
UPDATE starsparLocations SET hp = hp-1
WHERE locx IN (SELECT locx FROM starsparLocations WHERE objectname = 'projectile') 
AND locy IN (SELECT locy FROM starsparLocations WHERE objectname = 'projectile') 
AND objectname != 'projectile';




--DROP FUNCTION updateProjectile;
CREATE FUNCTION updateProjectile(mapNm text) RETURNS void AS $$
DECLARE
    var_r record;
BEGIN

FOR var_r IN(SELECT * FROM starsparLocations where mapname = mapNm) LOOP
UPDATE starsparLocations SET hp = case 
	when locX <= var_r.locX
	AND var_r.locX <= locX +32
	AND locy <= var_r.locY +32
	AND var_r.locY <= locy +32
	AND objectname != var_r.objectname
	then hp-1
	else hp -- don't change anything
  end;

END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT updateProjectile('noob');SELECT * FROM starsparLocations;



(SELECT locx FROM starsparLocations WHERE objectname = 'projectile')

DO $$
DECLARE
    var_r RECORD;
BEGIN
	FOR var_r IN (SELECT * FROM starsparLocations where mapname = 'noob') LOOP
	SELECT * FROM starsparLocations WHERE locx > var_r.locx AND locx < var_r.locy;
	END LOOP;
END; $$

--SELECT * FROM starsparLocations where WHERE locx > 1000 AND locx < 2000
--DROP FUNCTION for_loop_through_query
CREATE FUNCTION for_loop_through_query(
   n INTEGER DEFAULT 10
) 
RETURNS VOID AS $$
DECLARE
    var_r RECORD;
BEGIN
	FOR var_r IN (SELECT * FROM starsparLocations where mapname = 'noob') LOOP
	SELECT * FROM starsparLocations WHERE locx > var_r.locx AND locx < var_r.locy;
	END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT for_loop_through_query(10)

   
SELECT objectname,
   CASE WHEN locx IN (SELECT locx FROM starsparLocations WHERE objectname = 'projectile') THEN 'one hundred'
   END
FROM starsparLocations;


SELECT locx,locy FROM starsparLocations WHERE objectname = 'Player1';
SELECT insertProjectile('noob',1185,5052,200,400);

SELECT *,
    CASE WHEN locx IN (SELECT locx FROM starsparLocations WHERE objectname = 'projectile') THEN 'one hundred'
    WHEN locy IN (SELECT locy FROM starsparLocations WHERE objectname = 'projectile') THEN 'two hundred'
	ELSE 'other'
      END
    AS "Mass",
    CASE WHEN hp < 20 THEN 'ow'
	ELSE 'good'
      END
    AS "health"
FROM starsparLocations
WHERE objectname != 'projectile'

SELECT objectName,count(*) FROM starsparLocations GROUP BY objectName ORDER BY count DESC

SELECT * FROM starsparLocations 

--DROP FUNCTION updatePlayer2;
CREATE FUNCTION updatePlayer2(objName text, mapNm text, locyX numeric, locyY numeric, ammo1 numeric, score1 numeric) RETURNS TABLE (
	--idx INT,
	objectNm VARCHAR,
	mapN2 VARCHAR,
	locX REAL,
	locY REAL,
	hp INT,
	ammo INT,
	score INT
) 
AS $$
DECLARE
    var_r record;
BEGIN
UPDATE starsparLocations
SET locx=locyX, locy=locyY, ammo=ammo1, score=score1
WHERE objectName=objName;

--RETURN QUERY SELECT * FROM starsparLocations where mapname = mapNm
FOR var_r IN(SELECT * FROM starsparLocations WHERE mapname = mapNm)  
LOOP
	objectNm := var_r.objectName;
	mapN2 := var_r.mapName;
	locX := var_r.locX;
	locY := var_r.locY;
	hp := var_r.hp;
	ammo := var_r.ammo;
	score := var_r.score;
	RETURN NEXT;
END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT updatePlayer2('projectile','noob',100,100,200,400);


SELECT score FROM starsparLocations where objectname = 'Player1'
SELECT updatePlayer('"+$user+"','"+map.name+"',"+player.x+", "+player.y+");
UPDATE starsparLocations SET ticksremaining = 1
WHERE objectName='demon' and ticksremaining <= 0;

starsparLocations (objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType);

INSERT INTO starsparLocations (objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType) 
SELECT 'Gilgamech','noob',150,150,100,100,0,100,'Gilgamech',1,'player';
INSERT INTO starsparLocations (objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType)
SELECT 'demon', 'noob',15,15,100,100,0,100,'demon',0,'npc';
INSERT INTO starsparLocations (objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType)
VALUES ('Player1', 'noob',15,15,100,1200,1200,100,'Player1',1,'player');
SELECT * FROM starsparLocations;

delete FROM starsparLocations where objectname='projectile' and hp = 0;
UPDATE starsparLocations SET hp = (SELECT hp from starsparLocations WHERE objectName = 'projectile')-1 WHERE objectName = 'projectile';
UPDATE starsparLocations SET locx = (SELECT locx from starsparLocations WHERE objectName = 'projectile')+10 WHERE objectName = 'projectile';
UPDATE starsparLocations SET locy = (SELECT locy from starsparLocations WHERE objectName = 'projectile')+10 WHERE objectName = 'projectile';


ON CONFLICT (objectName = 'Player1') DO UPDATE SET score = 0;
INSERT INTO starsparLocations (objectName, mapName, locX, locY, hp, ammo, score) SELECT 'Gilgamech', 'noob',15,15,100,100,0
WHERE NOT EXISTS (SELECT id FROM starsparLocations WHERE objectName = 'Player1');
INSERT INTO starsparLocations (objectName, mapName, locX, locY, hp, ammo, score) VALUES ('demon', 'noob',10,10,100,100,0) ON CONFLICT (objectName) DO UPDATE SET score = 0;
INSERT INTO starsparLocations (objectName, mapName, locX, locY, hp, ammo, score) VALUES ('Player1', 'noob',15,15,100,100,0) ON CONFLICT (objectName = 'Player1') DO UPDATE SET score = 0;
VALUES ('demon', 'noob',10,10,100,100,0);
UPDATE starsparLocations SET score = (SELECT score from starsparLocations WHERE objectName = 'Player1')+1 WHERE objectName = 'Player1';

SELECT * FROM starsparLocations where mapname = 'noob';
--delete FROM starsparLocations where objectname='projectile'
UPDATE starsparLocations SET locx='250', locy='222.28' WHERE objectName='Player1'

SELECT locx,locy FROM starsparLocations where objectName='demon'


SELECT objectName,count(*) FROM starsparLocations GROUP BY objectName ORDER BY count DESC


 