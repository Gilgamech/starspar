--List of tables
SELECT tablename 
FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog' AND 
    schemaname != 'information_schema';

--DROP FUNCTION updatePlayer(objName text, mapNm text, locyX unknown, locyY unknown, updateloc unknown);
CREATE FUNCTION updatePlayer(objName text, mapNm text, locyX text, locyY text, updateloc text) RETURNS void
AS $$
DECLARE
    var_r record;
BEGIN


END;
$$ LANGUAGE plpgsql;

SELECT updatePlayer('Player3','noob','undefined','undefined','undefined');


FOR var_r IN (
	SELECT * FROM starsparLocations st
	WHERE st.mapname = mapNm 
		AND st.ticksremaining > 0 
		AND st.locX <= locyX +2000
		AND locyX <= st.locX +2000
		AND st.locy <= locyY +2000
		AND locyY <= st.locy +2000
	OR st.mapname = mapNm 
		AND st.objectName = 'demon'
	OR st.mapname = mapNm 
		AND st.objectName = objName
	OR st.mapname = mapNm 
		AND st.objecttype = 'player'
		AND st.ticksremaining > 0 
)
LOOP
	objectName := var_r.objectName;
	mapName := var_r.mapName;
	locX := var_r.locX;
	locY := var_r.locY;
	hp := var_r.hp;
	ammo := var_r.ammo;
	score := var_r.score;
	ticksremaining := var_r.ticksremaining;
	objectowner := var_r.objectowner;
	updatelocation := var_r.updatelocation;
	objecttype := var_r.objecttype;
	RETURN NEXT;
END LOOP;
END;
$$ LANGUAGE plpgsql;
SELECT * FROM updatePlayer2('Gilgamech','noob',2580.1,6220.2,0)



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


ON CONFLICT (objectName = 'Player1') DO UPDATE SET score = 0;
INSERT INTO starsparLocations (objectName, mapName, locX, locY, hp, ammo, score) SELECT 'Gilgamech', 'noob',15,15,100,100,0
WHERE NOT EXISTS (SELECT id FROM starsparLocations WHERE objectName = 'Player1');
INSERT INTO starsparLocations (objectName, mapName, locX, locY, hp, ammo, score) VALUES ('demon', 'noob',10,10,100,100,0) ON CONFLICT (objectName) DO UPDATE SET score = 0;
INSERT INTO starsparLocations (objectName, mapName, locX, locY, hp, ammo, score) VALUES ('Player1', 'noob',15,15,100,100,0) ON CONFLICT (objectName = 'Player1') DO UPDATE SET score = 0;
VALUES ('demon', 'noob',10,10,100,100,0);
UPDATE starsparLocations SET score = (SELECT score from starsparLocations WHERE objectName = 'Player1')+1 WHERE objectName = 'Player1';




 