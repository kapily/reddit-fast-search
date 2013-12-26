__author__ = 'kyedidi'


from reddit_database_manager import DatabaseManager
from reddit_fetcher import RedditFetcher

DATABASE_PATH = "reddit_submissions.sqlite"

def main():
  #r = praw.Reddit('Search post info example by u/_Daimon')
  #help(r.search)
  #exit()
  image_manager = DatabaseManager(DATABASE_PATH)


  # PRAW Stuff
  f = RedditFetcher(image_manager)
  f.update_posts()
  print "Added", image_manager.new_rows_written, "new entries total."
  print "Modified", image_manager.rows_written, " total entries ."
  print "Found", image_manager.already_exist, "that already exist."



if __name__ == "__main__":
  main()