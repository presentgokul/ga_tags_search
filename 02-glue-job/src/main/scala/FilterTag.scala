import com.amazonaws.services.glue.GlueContext
import com.amazonaws.services.glue.util.{GlueArgParser}
import org.apache.spark.sql.types.StructType
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.sql.{DataFrame, Row, SparkSession, SaveMode}
import org.apache.spark.sql.functions._

object FilterTag {
  def main(sysArgs: Array[String]): Unit = {
    print("Search Request..");
    val spark: SparkContext = if(!sysArgs.exists(_.contains("JOB_RUN_ID"))){
      val conf = new SparkConf()
        .set("fs.s3a.aws.credentials.provider", "org.apache.hadoop.fs.s3a.TemporaryAWSCredentialsProvider")
        .setAppName("myApp")
        .setMaster("local[*]")
      SparkContext.getOrCreate(conf)
    } else SparkContext.getOrCreate()

    spark.hadoopConfiguration.set("fs.s3a.server-side-encryption-algorithm", "AES256")
    spark.hadoopConfiguration.set("spark.sql.files.ignoreMissingFiles", "true")
    val glueContext: GlueContext = new GlueContext(spark)
    val sparkSession: SparkSession = glueContext.getSparkSession
   
    val args: Map[String, String] = GlueArgParser.getResolvedOptions(sysArgs, Seq("JOB_NAME","SEARCH_PATH", "SERVICE_S3BUCKET", "REQUEST_ID","GA_PREPROCESSED_DATABUCKET", "Filter").toArray)
    
    val processedGAEdges = sparkSession.read.parquet("s3a://"+args("GA_PREPROCESSED_DATABUCKET")+"/raw/gaid/gatags/v1/"+args("SEARCH_PATH"))
    val filteredDf = processedGAEdges.select(col("clientId"),col("tag")).where("lower(tag) = lower('"+args("Filter")+"')")
  
    val s3Output = "s3a://"+args("SERVICE_S3BUCKET")+"/"+args("REQUEST_ID");
    filteredDf.coalesce(1).write.format("csv").save(s3Output)
    print("Completed");
  }

}