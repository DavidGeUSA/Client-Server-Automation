namespace CsaTest
{
	partial class Form1
	{
		/// <summary>
		/// Required designer variable.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Clean up any resources being used.
		/// </summary>
		/// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		protected override void Dispose(bool disposing)
		{
			if (disposing && (components != null))
			{
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Windows Form Designer generated code

		/// <summary>
		/// Required method for Designer support - do not modify
		/// the contents of this method with the code editor.
		/// </summary>
		private void InitializeComponent()
		{
			this.label1 = new System.Windows.Forms.Label();
			this.txtPreproc = new System.Windows.Forms.TextBox();
			this.btPreproc = new System.Windows.Forms.Button();
			this.label2 = new System.Windows.Forms.Label();
			this.txtSampleFolder = new System.Windows.Forms.TextBox();
			this.btSampleFolder = new System.Windows.Forms.Button();
			this.label3 = new System.Windows.Forms.Label();
			this.txtOutput = new System.Windows.Forms.TextBox();
			this.btOutput = new System.Windows.Forms.Button();
			this.label4 = new System.Windows.Forms.Label();
			this.txtPreprocURL = new System.Windows.Forms.TextBox();
			this.label5 = new System.Windows.Forms.Label();
			this.txtStandardFolder = new System.Windows.Forms.TextBox();
			this.btStandardFolder = new System.Windows.Forms.Button();
			this.btStart = new System.Windows.Forms.Button();
			this.btCancel = new System.Windows.Forms.Button();
			this.listBox1 = new System.Windows.Forms.ListBox();
			this.label6 = new System.Windows.Forms.Label();
			this.lblFile = new System.Windows.Forms.Label();
			this.progressBar1 = new System.Windows.Forms.ProgressBar();
			this.label7 = new System.Windows.Forms.Label();
			this.txtWebFolder = new System.Windows.Forms.TextBox();
			this.btWebFolder = new System.Windows.Forms.Button();
			this.picRet = new System.Windows.Forms.PictureBox();
			((System.ComponentModel.ISupportInitialize)(this.picRet)).BeginInit();
			this.SuspendLayout();
			// 
			// label1
			// 
			this.label1.AutoSize = true;
			this.label1.Location = new System.Drawing.Point(13, 15);
			this.label1.Name = "label1";
			this.label1.Size = new System.Drawing.Size(98, 13);
			this.label1.TabIndex = 0;
			this.label1.Text = "Preprocessor utility:";
			// 
			// txtPreproc
			// 
			this.txtPreproc.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.txtPreproc.Location = new System.Drawing.Point(117, 12);
			this.txtPreproc.Name = "txtPreproc";
			this.txtPreproc.Size = new System.Drawing.Size(521, 20);
			this.txtPreproc.TabIndex = 1;
			this.txtPreproc.TextChanged += new System.EventHandler(this.txtPreproc_TextChanged);
			// 
			// btPreproc
			// 
			this.btPreproc.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
			this.btPreproc.Location = new System.Drawing.Point(644, 9);
			this.btPreproc.Name = "btPreproc";
			this.btPreproc.Size = new System.Drawing.Size(41, 23);
			this.btPreproc.TabIndex = 2;
			this.btPreproc.Text = "...";
			this.btPreproc.UseVisualStyleBackColor = true;
			this.btPreproc.Click += new System.EventHandler(this.btPreproc_Click);
			// 
			// label2
			// 
			this.label2.AutoSize = true;
			this.label2.Location = new System.Drawing.Point(20, 50);
			this.label2.Name = "label2";
			this.label2.Size = new System.Drawing.Size(91, 13);
			this.label2.TabIndex = 3;
			this.label2.Text = "Test cases folder:";
			// 
			// txtSampleFolder
			// 
			this.txtSampleFolder.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.txtSampleFolder.Location = new System.Drawing.Point(117, 47);
			this.txtSampleFolder.Name = "txtSampleFolder";
			this.txtSampleFolder.Size = new System.Drawing.Size(521, 20);
			this.txtSampleFolder.TabIndex = 4;
			this.txtSampleFolder.TextChanged += new System.EventHandler(this.txtSampleFolder_TextChanged);
			// 
			// btSampleFolder
			// 
			this.btSampleFolder.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
			this.btSampleFolder.Location = new System.Drawing.Point(644, 44);
			this.btSampleFolder.Name = "btSampleFolder";
			this.btSampleFolder.Size = new System.Drawing.Size(41, 23);
			this.btSampleFolder.TabIndex = 5;
			this.btSampleFolder.Text = "...";
			this.btSampleFolder.UseVisualStyleBackColor = true;
			this.btSampleFolder.Click += new System.EventHandler(this.btSampleFolder_Click);
			// 
			// label3
			// 
			this.label3.AutoSize = true;
			this.label3.Location = new System.Drawing.Point(40, 83);
			this.label3.Name = "label3";
			this.label3.Size = new System.Drawing.Size(71, 13);
			this.label3.TabIndex = 6;
			this.label3.Text = "Output folder:";
			// 
			// txtOutput
			// 
			this.txtOutput.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.txtOutput.Location = new System.Drawing.Point(117, 80);
			this.txtOutput.Name = "txtOutput";
			this.txtOutput.Size = new System.Drawing.Size(521, 20);
			this.txtOutput.TabIndex = 7;
			this.txtOutput.TextChanged += new System.EventHandler(this.txtOutput_TextChanged);
			// 
			// btOutput
			// 
			this.btOutput.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
			this.btOutput.Location = new System.Drawing.Point(644, 78);
			this.btOutput.Name = "btOutput";
			this.btOutput.Size = new System.Drawing.Size(41, 23);
			this.btOutput.TabIndex = 8;
			this.btOutput.Text = "...";
			this.btOutput.UseVisualStyleBackColor = true;
			this.btOutput.Click += new System.EventHandler(this.btOutput_Click);
			// 
			// label4
			// 
			this.label4.AutoSize = true;
			this.label4.Location = new System.Drawing.Point(14, 118);
			this.label4.Name = "label4";
			this.label4.Size = new System.Drawing.Size(97, 13);
			this.label4.TabIndex = 9;
			this.label4.Text = "Preprocessor URL:";
			// 
			// txtPreprocURL
			// 
			this.txtPreprocURL.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.txtPreprocURL.Location = new System.Drawing.Point(117, 115);
			this.txtPreprocURL.Name = "txtPreprocURL";
			this.txtPreprocURL.Size = new System.Drawing.Size(521, 20);
			this.txtPreprocURL.TabIndex = 10;
			this.txtPreprocURL.Text = "http://localhost/csaAsp/csapre/csapreproc.html";
			this.txtPreprocURL.TextChanged += new System.EventHandler(this.txtPreprocURL_TextChanged);
			// 
			// label5
			// 
			this.label5.AutoSize = true;
			this.label5.Location = new System.Drawing.Point(9, 175);
			this.label5.Name = "label5";
			this.label5.Size = new System.Drawing.Size(102, 13);
			this.label5.TabIndex = 11;
			this.label5.Text = "Compare files folder:";
			// 
			// txtStandardFolder
			// 
			this.txtStandardFolder.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.txtStandardFolder.Location = new System.Drawing.Point(117, 173);
			this.txtStandardFolder.Name = "txtStandardFolder";
			this.txtStandardFolder.Size = new System.Drawing.Size(521, 20);
			this.txtStandardFolder.TabIndex = 12;
			this.txtStandardFolder.TextChanged += new System.EventHandler(this.txtStandardFolder_TextChanged);
			// 
			// btStandardFolder
			// 
			this.btStandardFolder.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
			this.btStandardFolder.Location = new System.Drawing.Point(644, 170);
			this.btStandardFolder.Name = "btStandardFolder";
			this.btStandardFolder.Size = new System.Drawing.Size(41, 23);
			this.btStandardFolder.TabIndex = 13;
			this.btStandardFolder.Text = "...";
			this.btStandardFolder.UseVisualStyleBackColor = true;
			this.btStandardFolder.Click += new System.EventHandler(this.btStandardFolder_Click);
			// 
			// btStart
			// 
			this.btStart.Enabled = false;
			this.btStart.Location = new System.Drawing.Point(117, 201);
			this.btStart.Name = "btStart";
			this.btStart.Size = new System.Drawing.Size(75, 23);
			this.btStart.TabIndex = 14;
			this.btStart.Text = "&Start";
			this.btStart.UseVisualStyleBackColor = true;
			this.btStart.Click += new System.EventHandler(this.btStart_Click);
			// 
			// btCancel
			// 
			this.btCancel.Enabled = false;
			this.btCancel.Location = new System.Drawing.Point(198, 201);
			this.btCancel.Name = "btCancel";
			this.btCancel.Size = new System.Drawing.Size(75, 23);
			this.btCancel.TabIndex = 15;
			this.btCancel.Text = "&Cancel";
			this.btCancel.UseVisualStyleBackColor = true;
			this.btCancel.Click += new System.EventHandler(this.btCancel_Click);
			// 
			// listBox1
			// 
			this.listBox1.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.listBox1.BackColor = System.Drawing.SystemColors.Menu;
			this.listBox1.FormattingEnabled = true;
			this.listBox1.Location = new System.Drawing.Point(117, 257);
			this.listBox1.Name = "listBox1";
			this.listBox1.Size = new System.Drawing.Size(521, 95);
			this.listBox1.TabIndex = 16;
			this.listBox1.DoubleClick += new System.EventHandler(this.listBox1_DoubleClick);
			// 
			// label6
			// 
			this.label6.AutoSize = true;
			this.label6.Location = new System.Drawing.Point(52, 257);
			this.label6.Name = "label6";
			this.label6.Size = new System.Drawing.Size(59, 13);
			this.label6.TabIndex = 17;
			this.label6.Text = "Failed files:";
			// 
			// lblFile
			// 
			this.lblFile.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.lblFile.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
			this.lblFile.Location = new System.Drawing.Point(279, 201);
			this.lblFile.Name = "lblFile";
			this.lblFile.Size = new System.Drawing.Size(359, 23);
			this.lblFile.TabIndex = 18;
			this.lblFile.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// progressBar1
			// 
			this.progressBar1.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.progressBar1.Location = new System.Drawing.Point(117, 230);
			this.progressBar1.Name = "progressBar1";
			this.progressBar1.Size = new System.Drawing.Size(521, 16);
			this.progressBar1.TabIndex = 19;
			// 
			// label7
			// 
			this.label7.AutoSize = true;
			this.label7.Location = new System.Drawing.Point(19, 146);
			this.label7.Name = "label7";
			this.label7.Size = new System.Drawing.Size(92, 13);
			this.label7.TabIndex = 20;
			this.label7.Text = "JavaScript Folder:";
			// 
			// txtWebFolder
			// 
			this.txtWebFolder.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
			this.txtWebFolder.Location = new System.Drawing.Point(117, 143);
			this.txtWebFolder.Name = "txtWebFolder";
			this.txtWebFolder.Size = new System.Drawing.Size(521, 20);
			this.txtWebFolder.TabIndex = 21;
			this.txtWebFolder.TextChanged += new System.EventHandler(this.txtWebFolder_TextChanged);
			// 
			// btWebFolder
			// 
			this.btWebFolder.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
			this.btWebFolder.Location = new System.Drawing.Point(644, 141);
			this.btWebFolder.Name = "btWebFolder";
			this.btWebFolder.Size = new System.Drawing.Size(41, 23);
			this.btWebFolder.TabIndex = 22;
			this.btWebFolder.Text = "...";
			this.btWebFolder.UseVisualStyleBackColor = true;
			this.btWebFolder.Click += new System.EventHandler(this.btWebFolder_Click);
			// 
			// picRet
			// 
			this.picRet.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
			this.picRet.ErrorImage = global::CsaTest.Properties.Resources._cancel;
			this.picRet.Image = global::CsaTest.Properties.Resources.empty;
			this.picRet.InitialImage = global::CsaTest.Properties.Resources._ok;
			this.picRet.Location = new System.Drawing.Point(644, 201);
			this.picRet.Name = "picRet";
			this.picRet.Size = new System.Drawing.Size(35, 30);
			this.picRet.SizeMode = System.Windows.Forms.PictureBoxSizeMode.StretchImage;
			this.picRet.TabIndex = 23;
			this.picRet.TabStop = false;
			// 
			// Form1
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(703, 376);
			this.Controls.Add(this.picRet);
			this.Controls.Add(this.btWebFolder);
			this.Controls.Add(this.txtWebFolder);
			this.Controls.Add(this.label7);
			this.Controls.Add(this.progressBar1);
			this.Controls.Add(this.lblFile);
			this.Controls.Add(this.label6);
			this.Controls.Add(this.listBox1);
			this.Controls.Add(this.btCancel);
			this.Controls.Add(this.btStart);
			this.Controls.Add(this.btStandardFolder);
			this.Controls.Add(this.txtStandardFolder);
			this.Controls.Add(this.label5);
			this.Controls.Add(this.txtPreprocURL);
			this.Controls.Add(this.label4);
			this.Controls.Add(this.btOutput);
			this.Controls.Add(this.txtOutput);
			this.Controls.Add(this.label3);
			this.Controls.Add(this.btSampleFolder);
			this.Controls.Add(this.txtSampleFolder);
			this.Controls.Add(this.label2);
			this.Controls.Add(this.btPreproc);
			this.Controls.Add(this.txtPreproc);
			this.Controls.Add(this.label1);
			this.Name = "Form1";
			this.Text = "Client Server Automation Test";
			((System.ComponentModel.ISupportInitialize)(this.picRet)).EndInit();
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion

		private System.Windows.Forms.Label label1;
		private System.Windows.Forms.TextBox txtPreproc;
		private System.Windows.Forms.Button btPreproc;
		private System.Windows.Forms.Label label2;
		private System.Windows.Forms.TextBox txtSampleFolder;
		private System.Windows.Forms.Button btSampleFolder;
		private System.Windows.Forms.Label label3;
		private System.Windows.Forms.TextBox txtOutput;
		private System.Windows.Forms.Button btOutput;
		private System.Windows.Forms.Label label4;
		private System.Windows.Forms.TextBox txtPreprocURL;
		private System.Windows.Forms.Label label5;
		private System.Windows.Forms.TextBox txtStandardFolder;
		private System.Windows.Forms.Button btStandardFolder;
		private System.Windows.Forms.Button btStart;
		private System.Windows.Forms.Button btCancel;
		private System.Windows.Forms.ListBox listBox1;
		private System.Windows.Forms.Label label6;
		private System.Windows.Forms.Label lblFile;
		private System.Windows.Forms.ProgressBar progressBar1;
		private System.Windows.Forms.Label label7;
		private System.Windows.Forms.TextBox txtWebFolder;
		private System.Windows.Forms.Button btWebFolder;
		private System.Windows.Forms.PictureBox picRet;
	}
}

