import MySQLdb
conn = MySQLdb.connect(host="127.0.0.1", user="root", passwd="SUA_SENHA", db="mysql")
with conn.cursor() as c:
    c.execute("SELECT VERSION()")
    print("Server:", c.fetchone()[0])
conn.close()
